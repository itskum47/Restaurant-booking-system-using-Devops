import structlog
logger = structlog.get_logger(__name__)

from fastapi import APIRouter, HTTPException, status, Response, Request
from typing import List
import time
import os
import json
from datetime import datetime
import aiohttp
from app.utils.circuit_breaker import AsyncCircuitBreaker
from app.utils.retry import retry_async

from app.models.booking import Booking, BookingCreate, BookingUpdate, BookingCancel
from app.db.mongo import get_database
from bson import ObjectId

# Import Redis for pub/sub
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

router = APIRouter()

notification_breaker = AsyncCircuitBreaker(
    name="notification-service",
    failure_threshold=int(os.getenv("CB_NOTIFICATION_FAILURE_THRESHOLD", "5")),
    recovery_timeout_seconds=int(os.getenv("CB_NOTIFICATION_RECOVERY_SECONDS", "30")),
    half_open_success_threshold=int(os.getenv("CB_NOTIFICATION_HALF_OPEN_SUCCESS", "2")),
)

# Placeholders for metrics (will be injected from main.py)
bookings_created_total = None
bookings_cancelled_total = None
booking_processing_duration = None
active_bookings_total = None

def get_redis_client():
    """Get Redis client for pub/sub."""
    if not REDIS_AVAILABLE:
        return None
    
    try:
        redis_url = os.getenv("REDIS_URL", "redis://redis:6379")
        return redis.from_url(redis_url, decode_responses=True)
    except Exception as e:
        logger.warning(f"⚠️  Redis connection failed: {e}")
        return None

def publish_booking_event(event_type: str, booking_data: dict):
    """Publish booking event to Redis."""
    redis_client = get_redis_client()
    
    if redis_client:
        try:
            event = {
                "type": event_type,
                "timestamp": datetime.utcnow().isoformat(),
                "data": booking_data
            }
            redis_client.publish("booking-events", json.dumps(event))
            logger.info(f"✅ Published {event_type} event to Redis")
        except Exception as e:
            logger.error(f"⚠️  Failed to publish event: {e}")
    else:
        logger.info(f"ℹ️  Redis not available, event not published: {event_type}")

async def send_booking_confirmation_email(guest_email: str, guest_name: str, booking_data: dict):
    """
    Send booking confirmation email via notification service.
    Calls the notification-service async to avoid blocking.
    """
    try:
        notification_url = os.getenv(
            "NOTIFICATION_SERVICE_URL", 
            "http://notification-service:5000"
        )
        
        payload = {
            "email": guest_email,
            "guest_name": guest_name,
            "booking": {
                "booking_id": str(booking_data.get("_id", "")),
                "restaurant_name": booking_data.get("restaurant_name", ""),
                "date": booking_data.get("date", ""),
                "time": booking_data.get("time", ""),
                "party_size": booking_data.get("party_size", 0),
                "location": booking_data.get("location", ""),
            }
        }
        
        timeout_seconds = float(os.getenv("UPSTREAM_TIMEOUT_SECONDS", "8"))

        async def send_once():
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=timeout_seconds)) as session:
                async with session.post(
                    f"{notification_url}/send-booking-confirmation",
                    json=payload,
                ) as resp:
                    if resp.status >= 500:
                        raise RuntimeError(f"notification-service returned {resp.status}")
                    return resp.status

        status_code = await notification_breaker.call(
            lambda: retry_async(send_once, attempts=3, base_delay=0.25),
            fallback=lambda: 503,
        )

        if status_code == 200:
            logger.info(f"✅ Booking confirmation email sent to {guest_email}")
        else:
            logger.error(f"⚠️  Failed to send booking email: {status_code}")
    except Exception as e:
        logger.error(f"⚠️  Error sending booking confirmation email: {e}")
        # Don't raise - continue with booking even if email fails

@router.post("/", response_model=dict)
async def create_booking(booking: BookingCreate, response: Response, request: Request):
    """Create a new booking."""
    start_time = time.time()
    
    try:
        db = get_database()
        bookings_collection = db.bookings

        idempotency_key = request.headers.get("x-idempotency-key")
        if idempotency_key:
            existing = await bookings_collection.find_one({"idempotency_key": idempotency_key})
            if existing:
                existing["_id"] = str(existing["_id"])
                return {
                    "message": "Booking already created",
                    "booking_id": existing["_id"],
                    "booking": existing,
                }
        
        # Convert to dict and add  creation timestamp
        booking_dict = booking.model_dump()
        booking_dict["idempotency_key"] = idempotency_key
        booking_dict["created_at"] = datetime.utcnow().isoformat()
        
        if booking.party_size > 6:
            booking_dict["status"] = "waitlisted"
            response.status_code = status.HTTP_202_ACCEPTED
        else:
            booking_dict["status"] = "confirmed"
            response.status_code = status.HTTP_201_CREATED
        
        # Insert into database
        result = await bookings_collection.insert_one(booking_dict)
        booking_dict["_id"] = str(result.inserted_id)
        
        # Publish booking created event
        publish_booking_event("booking.created", booking_dict)
        
        # Record metrics
        duration = time.time() - start_time
        
        if bookings_created_total:
            # Determine party size bucket
            party_size = booking.party_size
            if party_size <= 2:
                bucket = "1-2"
            elif party_size <= 4:
                bucket = "3-4"
            elif party_size <= 6:
                bucket = "5-6"
            else:
                bucket = "7+"
            
            bookings_created_total.labels(
                cuisine_type=booking_dict.get("cuisine", "unknown"),
                party_size_bucket=bucket
            ).inc()
        
        if booking_processing_duration:
            booking_processing_duration.observe(duration)
        
        # Update active bookings count
        if active_bookings_total:
            active_count = await bookings_collection.count_documents({"status": "confirmed"})
            active_bookings_total.set(active_count)
        
        # Send confirmation email asynchronously
        if booking_dict.get("guest_email"):
            await send_booking_confirmation_email(
                guest_email=booking_dict.get("guest_email"),
                guest_name=booking_dict.get("guest_name", "Guest"),
                booking_data=booking_dict
            )
        
        return {
            "message": "Booking created successfully",
            "booking_id": str(result.inserted_id),
            "booking": booking_dict
        }
        
    except Exception as e:
        logger.error(f"Error creating booking: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create booking: {str(e)}"
        )

@router.get("/{booking_id}")
async def get_booking(booking_id: str):
    """Get booking by ID."""
    try:
        if not ObjectId.is_valid(booking_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid booking ID format"
            )
        
        db = get_database()
        bookings_collection = db.bookings
        
        booking = await bookings_collection.find_one({"_id": ObjectId(booking_id)})
        
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        booking["_id"] = str(booking["_id"])
        return booking
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching booking: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch booking: {str(e)}"
        )

@router.get("/user/{user_id}")
async def get_user_bookings(user_id: str, status: str = None):
    """Get all bookings for a user."""
    try:
        db = get_database()
        bookings_collection = db.bookings
        
        # Build query
        query = {"user_id": user_id}
        if status:
            query["status"] = status
        
        # Fetch bookings
        cursor = bookings_collection.find(query).sort("created_at", -1)
        bookings = await cursor.to_list(length=100)
        
        # Convert ObjectId to string
        for booking in bookings:
            booking["_id"] = str(booking["_id"])
        
        return {
            "user_id": user_id,
            "bookings": bookings,
            "count": len(bookings)
        }
        
    except Exception as e:
        logger.error(f"Error fetching user bookings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch bookings: {str(e)}"
        )

@router.put("/{booking_id}/cancel")
async def cancel_booking(booking_id: str, cancel_data: BookingCancel = None):
    """Cancel a booking."""
    start_time = time.time()
    
    try:
        if not ObjectId.is_valid(booking_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid booking ID format"
            )
        
        db = get_database()
        bookings_collection = db.bookings
        
        # Check if booking exists
        booking = await bookings_collection.find_one({"_id": ObjectId(booking_id)})
        
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        if booking.get("status") == "cancelled":
            return {
                "message": "Booking already cancelled",
                "booking_id": booking_id
            }
        
        # Update booking status
        result = await bookings_collection.update_one(
            {"_id": ObjectId(booking_id)},
            {
                "$set": {
                    "status": "cancelled",
                    "cancelled_at": datetime.utcnow().isoformat(),
                    "cancellation_reason": cancel_data.reason if cancel_data else "user_requested"
                }
            }
        )
        
        # Publish cancellation event
        booking["_id"] = str(booking["_id"])
        booking["status"] = "cancelled"
        publish_booking_event("booking.cancelled", booking)
        
        # Record metrics
        duration = time.time() - start_time
        
        if bookings_cancelled_total:
            reason = cancel_data.reason if cancel_data else "user_requested"
            bookings_cancelled_total.labels(reason=reason).inc()
        
        if booking_processing_duration:
            booking_processing_duration.observe(duration)
        
        # Update active bookings count
        if active_bookings_total:
            active_count = await bookings_collection.count_documents({"status": "confirmed"})
            active_bookings_total.set(active_count)
        
        return {
            "message": "Booking cancelled successfully",
            "booking_id": booking_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling booking: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel booking: {str(e)}"
        )

@router.get("/slots")
async def generate_time_slots(date: str, restaurant_id: str, party_size: int = 2):
    """Generate available time slots."""
    # Build query to check actual capacity or existing bookings if needed
    # For now, return hardcoded times 
    return {"slots": ["17:00", "18:00", "19:00", "20:00", "21:00"]}

@router.get("/")
async def list_bookings(
    status: str = None,
    date: str = None,
    restaurant_id: str = None,
    limit: int = 50
):
    """List bookings with optional filters."""
    try:
        db = get_database()
        bookings_collection = db.bookings
        
        # Build query
        query = {}
        if status:
            query["status"] = status
        if date:
            query["date"] = date
        if restaurant_id:
            query["restaurant_id"] = restaurant_id
        
        # Fetch bookings
        cursor = bookings_collection.find(query).sort("created_at", -1).limit(limit)
        bookings = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string
        for booking in bookings:
            booking["_id"] = str(booking["_id"])
        
        return {
            "bookings": bookings,
            "count": len(bookings),
            "filters": {"status": status, "date": date, "restaurant_id": restaurant_id}
        }
        
    except Exception as e:
        logger.error(f"Error listing bookings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list bookings: {str(e)}"
        )
