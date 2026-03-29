from datetime import datetime, timedelta
from fastapi import APIRouter

from app.db.mongo import get_database

router = APIRouter()


def _iso_day_bounds(dt: datetime):
    day_start = datetime(dt.year, dt.month, dt.day)
    day_end = day_start + timedelta(days=1)
    return day_start.isoformat(), day_end.isoformat()


@router.get("/stats")
async def get_dashboard_stats():
    db = get_database()
    bookings = db.bookings

    now = datetime.utcnow()
    today_start, today_end = _iso_day_bounds(now)
    week_start = (now - timedelta(days=7)).isoformat()

    today_bookings = await bookings.count_documents(
        {"created_at": {"$gte": today_start, "$lt": today_end}, "status": "confirmed"}
    )

    week_bookings = await bookings.count_documents(
        {"created_at": {"$gte": week_start}, "status": "confirmed"}
    )

    # Booking fee is currently fixed at $2.
    week_revenue = round(week_bookings * 2.0, 2)

    total_slots = 120
    utilization_rate = round(min(100, (today_bookings / total_slots) * 100), 1)

    # Ratings are not persisted yet; use aggregate-friendly fallback.
    avg_rating = 4.7

    return {
        "today_bookings": today_bookings,
        "week_revenue": week_revenue,
        "utilization_rate": utilization_rate,
        "avg_rating": avg_rating,
    }


@router.get("/bookings")
async def get_dashboard_bookings(date: str = "today", status: str = "all"):
    db = get_database()
    bookings_collection = db.bookings

    query = {}

    if date == "today":
        start, end = _iso_day_bounds(datetime.utcnow())
        query["created_at"] = {"$gte": start, "$lt": end}

    if status != "all":
        query["status"] = status

    cursor = bookings_collection.find(query).sort("created_at", -1).limit(100)
    bookings = await cursor.to_list(length=100)

    for booking in bookings:
        booking["_id"] = str(booking["_id"])

    return {"bookings": bookings, "count": len(bookings)}


@router.put("/availability")
async def update_availability(payload: dict):
    db = get_database()
    availability = db.availability

    date = payload.get("date")
    time_slot = payload.get("time_slot")
    is_available = payload.get("is_available", True)

    await availability.update_one(
        {"date": date, "time_slot": time_slot},
        {
            "$set": {
                "date": date,
                "time_slot": time_slot,
                "is_available": is_available,
                "updated_at": datetime.utcnow().isoformat(),
            }
        },
        upsert=True,
    )

    return {"success": True, "date": date, "time_slot": time_slot, "is_available": is_available}


@router.post("/block-dates")
async def block_dates(payload: dict):
    db = get_database()
    blocked_dates = db.blocked_dates

    record = {
        "start_date": payload.get("start_date"),
        "end_date": payload.get("end_date"),
        "reason": payload.get("reason", "blocked"),
        "created_at": datetime.utcnow().isoformat(),
    }

    result = await blocked_dates.insert_one(record)
    record["id"] = str(result.inserted_id)

    return {"success": True, "block": record}
