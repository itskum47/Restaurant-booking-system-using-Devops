import structlog
logger = structlog.get_logger(__name__)

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
import httpx
from datetime import datetime, timedelta

from app.services.llm_service import llm_service as gemini_service
from app.metrics.prometheus import (
    ai_requests_total,
    ai_inference_duration,
    booking_recommendations_total,
    llm_tokens_used_total
)
import time

router = APIRouter()

class BookingRequest(BaseModel):
    message: str = Field(..., description="Natural language booking request")
    user_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
    conversation_history: Optional[List[Dict[str, str]]] = None

class BookingResponse(BaseModel):
    intent: str
    confidence: float
    intent_data: Dict[str, Any]
    recommendations: List[Dict[str, Any]]
    response: str

class RecommendationQuery(BaseModel):
    cuisine: Optional[str] = None
    party_size: Optional[int] = None
    date: Optional[str] = None
    location: Optional[str] = None
    price_range: Optional[str] = None

@router.post("/booking", response_model=BookingResponse)
async def process_booking_request(request: BookingRequest):
    """
    Process natural language booking request using Gemini AI.
    Extracts booking intent and returns restaurant recommendations.
    """
    start_time = time.time()
    
    try:
        # Parse the booking request using Gemini
        parsed_data = await gemini_service.parse_booking_intent(
            message=request.message,
            conversation_history=request.conversation_history or []
        )
        
        # Extract booking details from Gemini response
        intent_data = parsed_data.get("intent", {})
        recommendations = parsed_data.get("recommendations", [])
        response_text = parsed_data.get("response", "")
        
        # Determine cuisine for metrics
        cuisine = intent_data.get("cuisine") or "general"
        
        # Record metrics
        duration = time.time() - start_time
        ai_requests_total.labels(intent_type=cuisine, status="success").inc()
        ai_inference_duration.labels(intent_type=cuisine).observe(duration)
        
        if cuisine != "general":
            booking_recommendations_total.labels(cuisine_type=cuisine).inc()
        
        # Track token usage if available
        tokens_used = parsed_data.get("_tokens_used", 0)
        if tokens_used:
            llm_tokens_used_total.labels(
                model=parsed_data.get("_model", "gemini-1.5-flash")
            ).inc(tokens_used)
        
        return BookingResponse(
            intent=parsed_data.get("_model", "gemini"),
            confidence=parsed_data.get("_confidence", 0.90),
            intent_data=intent_data,
            recommendations=recommendations,
            response=response_text
        )
        
    except Exception as e:
        duration = time.time() - start_time
        ai_requests_total.labels(intent_type="unknown", status="error").inc()
        ai_inference_duration.labels(intent_type="error").observe(duration)
        
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations")
async def get_recommendations(
    cuisine: Optional[str] = None,
    party_size: Optional[int] = None,
    date: Optional[str] = None,
    location: Optional[str] = None,
    price_range: Optional[str] = None
):
    """
    Get restaurant recommendations based on criteria.
    """
    try:
        criteria = {
            "cuisine": cuisine,
            "party_size": party_size,
            "date": date,
            "location": location,
            "price_range": price_range
        }
        
        # Remove None values
        criteria = {k: v for k, v in criteria.items() if v is not None}
        
        recommendations = await get_restaurant_recommendations(criteria)
        
        if cuisine:
            booking_recommendations_total.labels(cuisine_type=cuisine).inc()
        
        return {
            "criteria": criteria,
            "recommendations": recommendations,
            "count": len(recommendations)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def get_restaurant_recommendations(criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Fetch restaurant recommendations from restaurant service.
    """
    restaurant_service_url = os.getenv(
        "RESTAURANT_SERVICE_URL",
        "http://restaurant-service:3001"
    )
    
    try:
        params = {}
        if criteria.get("cuisine"):
            params["cuisine"] = criteria["cuisine"]
        if criteria.get("location"):
            params["city"] = criteria["location"]
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{restaurant_service_url}/api/v1/restaurants",
                params=params
            )
            
            if response.status_code == 200:
                data = response.json()
                restaurants = data.get("restaurants", [])
                
                # Add available time slots for the requested date
                for restaurant in restaurants:
                    restaurant["available_slots"] = generate_time_slots(
                        criteria.get("date"),
                        criteria.get("party_size", 2)
                    )
                
                return restaurants[:5]  # Return top 5 recommendations
            else:
                logger.info(f"Restaurant service returned status {response.status_code}")
                return get_mock_recommendations(criteria)
                
    except Exception as e:
        logger.error(f"Error fetching recommendations: {e}")
        return get_mock_recommendations(criteria)

def get_mock_recommendations(criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Return mock recommendations when restaurant service is unavailable.
    """
    cuisine = criteria.get("cuisine", "Italian")
    
    mock_restaurants = [
        {
            "id": "mock-001",
            "name": f"Bella {cuisine}",
            "cuisine": cuisine,
            "rating": 4.5,
            "price_range": "$$",
            "city": criteria.get("location", "Downtown"),
            "address": "123 Main Street",
            "available_slots": generate_time_slots(criteria.get("date"), criteria.get("party_size", 2))
        },
        {
            "id": "mock-002",
            "name": f"The {cuisine} House",
            "cuisine": cuisine,
            "rating": 4.7,
            "price_range": "$$$",
            "city": criteria.get("location", "Downtown"),
            "address": "456 Oak Avenue",
            "available_slots": generate_time_slots(criteria.get("date"), criteria.get("party_size", 2))
        },
        {
            "id": "mock-003",
            "name": f"{cuisine} Bistro",
            "cuisine": cuisine,
            "rating": 4.3,
            "price_range": "$$",
            "city": criteria.get("location", "Downtown"),
            "address": "789 Elm Street",
            "available_slots": generate_time_slots(criteria.get("date"), criteria.get("party_size", 2))
        }
    ]
    
    return mock_restaurants

def generate_time_slots(date: Optional[str], party_size: int = 2) -> List[str]:
    """
    Generate available time slots for a given date.
    """
    # Standard dinner time slots
    slots = ["17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"]
    
    # Return subset based on party size (larger parties have fewer options)
    if party_size and party_size > 6:
        return slots[::2]  # Every other slot
    
    return slots

def generate_response_message(extracted: Dict[str, Any], recommendations: List[Dict[str, Any]]) -> str:
    """
    Generate a natural language response message.
    """
    party_size = extracted.get("party_size", "your party")
    cuisine = extracted.get("cuisine", "")
    date = extracted.get("date", "your preferred date")
    time = extracted.get("time", "")
    
    if not recommendations:
        return f"I couldn't find any {cuisine} restaurants available for {party_size} people on {date}. Would you like to try different criteria?"
    
    count = len(recommendations)
    cuisine_text = f"{cuisine} " if cuisine else ""
    
    message = f"Great! I found {count} {cuisine_text}restaurant{'s' if count > 1 else ''} available"
    
    if party_size:
        message += f" for {party_size} {'person' if party_size == 1 else 'people'}"
    
    if date and date != "your preferred date":
        message += f" on {date}"
    
    if time:
        message += f" around {time}"
    
    message += ". Here are my top recommendations. Would you like to book one of these?"
    
    return message
