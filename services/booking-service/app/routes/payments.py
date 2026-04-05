import structlog
logger = structlog.get_logger(__name__)

import stripe
import os
import asyncio
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import aiohttp

from app.db.mongo import get_database

# Initialize Stripe with strict secret requirement.
stripe_secret_key = os.getenv("STRIPE_SECRET_KEY")
if not stripe_secret_key:
    raise RuntimeError("STRIPE_SECRET_KEY is required and must be injected securely")
stripe.api_key = stripe_secret_key

router = APIRouter()

class PaymentIntentRequest(BaseModel):
    restaurant_name: str
    date: str
    time: str
    party_size: int
    user_id: Optional[str] = None
    guest_email: Optional[str] = None
    guest_name: Optional[str] = None

class PaymentConfirmRequest(BaseModel):
    idempotency_key: Optional[str] = None
    payment_intent_id: str
    restaurant_name: str
    cuisine: str
    date: str
    time: str
    party_size: int
    guest_name: str
    guest_email: str
    user_id: Optional[str] = None
    special_requests: Optional[str] = None

# POST /api/v1/payments/create-intent
@router.post("/create-intent")
async def create_payment_intent(request: PaymentIntentRequest):
    """
    Create a Stripe PaymentIntent for booking fee ($2.00)
    """
    try:
        intent = stripe.PaymentIntent.create(
            amount=200,  # $2.00 in cents
            currency="usd",
            metadata={
                "restaurant": request.restaurant_name,
                "date": request.date,
                "time": request.time,
                "party_size": str(request.party_size),
                "user_id": request.user_id or "guest",
            },
            description=f"DINE.AI Booking Fee — {request.restaurant_name} on {request.date}"
        )
        
        return {
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id,
            "booking_fee": "$2.00",
            "amount_cents": 200,
            "currency": "usd",
        }
    except stripe.error.StripeAPIError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stripe error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating payment intent: {str(e)}"
        )

# POST /api/v1/payments/confirm
@router.post("/confirm")
async def confirm_payment(request: PaymentConfirmRequest):
    """
    Confirm payment and create booking after successful payment
    """
    try:
        # Verify payment intent status
        intent = stripe.PaymentIntent.retrieve(request.payment_intent_id)
        
        if intent.status != "succeeded":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment not completed. Status: {intent.status}"
            )
        
        db = get_database()

        # Idempotency protection for client retries.
        if request.idempotency_key:
            existing = await db.bookings.find_one({"idempotency_key": request.idempotency_key})
            if existing:
                existing["id"] = str(existing["_id"])
                return {
                    "success": True,
                    "message": "Booking already confirmed",
                    "payment_intent_id": existing.get("payment_intent_id"),
                    "booking": existing,
                }

        # Payment successful - create booking record in MongoDB
        booking_data = {
            "idempotency_key": request.idempotency_key,
            "restaurant_name": request.restaurant_name,
            "cuisine": request.cuisine,
            "date": request.date,
            "time": request.time,
            "time_slot": request.time,
            "party_size": request.party_size,
            "guest_name": request.guest_name,
            "guest_email": request.guest_email,
            "special_requests": request.special_requests,
            "payment_intent_id": request.payment_intent_id,
            "user_id": request.user_id or "guest",
            "status": "confirmed",
            "created_at": datetime.utcnow().isoformat(),
        }

        result = await db.bookings.insert_one(booking_data)
        booking_id = str(result.inserted_id)

        # Send booking confirmation email via notification service.
        notification_url = os.getenv("NOTIFICATION_SERVICE_URL", "http://notification-service:3003")
        try:
            payload = {
                "email": request.guest_email,
                "guest_name": request.guest_name,
                "booking": {
                    "bookingId": booking_id,
                    "restaurantName": request.restaurant_name,
                    "date": request.date,
                    "time": request.time,
                    "partySize": request.party_size,
                    "location": "Restaurant Location",
                },
            }

            attempt = 0
            max_attempts = 3
            timeout = aiohttp.ClientTimeout(total=4)
            while attempt < max_attempts:
                attempt += 1
                try:
                    async with aiohttp.ClientSession(timeout=timeout) as session:
                        async with session.post(
                            f"{notification_url}/send-booking-confirmation",
                            json=payload,
                        ) as resp:
                            if resp.status < 500:
                                break
                            raise RuntimeError(f"notification-service returned {resp.status}")
                except Exception as notify_err:
                    if attempt >= max_attempts:
                        logger.warning(
                            "notification delivery failed after retries",
                            booking_id=booking_id,
                            error=str(notify_err),
                        )
                        break
                    await asyncio.sleep(attempt * 0.5)
        except Exception as notify_outer_err:
            # Do not fail booking if email service is unavailable.
            logger.warning(
                "notification delivery skipped",
                booking_id=booking_id,
                error=str(notify_outer_err),
            )
        
        return {
            "success": True,
            "message": "Booking confirmed!",
            "payment_intent_id": request.payment_intent_id,
            "booking": {
                "id": booking_id,
                **booking_data,
            },
        }
        
    except stripe.error.InvalidRequestError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid payment request: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error confirming payment: {str(e)}"
        )

# POST /api/v1/payments/webhook
@router.post("/webhook")
async def stripe_webhook(request):
    """
    Handle Stripe webhook events (for future use)
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, 
            sig_header, 
            os.getenv("STRIPE_WEBHOOK_SECRET", "")
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    if event["type"] == "payment_intent.succeeded":
        logger.info(f"✅ Payment succeeded: {event['data']['object']['id']}")
    elif event["type"] == "payment_intent.payment_failed":
        logger.error(f"❌ Payment failed: {event['data']['object']['id']}")
    
    return {"status": "received"}
