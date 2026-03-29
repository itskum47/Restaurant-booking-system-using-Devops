from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")

class Booking(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str
    restaurant_id: str
    restaurant_name: str
    date: str  # ISO date string
    time_slot: str  # HH:MM format
    party_size: int
    status: str = "confirmed"  # confirmed, cancelled, pending
    special_requests: Optional[str] = None
    ai_generated: bool = False
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class BookingCreate(BaseModel):
    user_id: str
    restaurant_id: str
    restaurant_name: str
    date: str
    time_slot: str
    party_size: int
    special_requests: Optional[str] = None
    ai_generated: bool = False

class BookingUpdate(BaseModel):
    status: Optional[str] = None
    special_requests: Optional[str] = None

class BookingCancel(BaseModel):
    reason: Optional[str] = "user_requested"
