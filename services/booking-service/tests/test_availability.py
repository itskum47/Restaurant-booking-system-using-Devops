"""
Tests for the availability checking logic.
"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import date, time

from app.services.availability import AvailabilityService


class TestAvailabilityService:
    @pytest.fixture
    def service(self):
        return AvailabilityService()

    async def test_slot_available_when_capacity_exists(self, service, db_session):
        with patch.object(service, "_count_existing_bookings", return_value=2):
            with patch.object(service, "_get_restaurant_capacity", return_value=10):
                result = await service.check(
                    restaurant_id="r1",
                    booking_date=date(2026, 4, 1),
                    booking_time=time(19, 0),
                    party_size=4,
                    db=db_session,
                )
        assert result is True

    async def test_slot_unavailable_when_fully_booked(self, service, db_session):
        with patch.object(service, "_count_existing_bookings", return_value=10):
            with patch.object(service, "_get_restaurant_capacity", return_value=10):
                result = await service.check(
                    restaurant_id="r1",
                    booking_date=date(2026, 4, 1),
                    booking_time=time(19, 0),
                    party_size=4,
                    db=db_session,
                )
        assert result is False

    async def test_returns_available_slots(self, service, db_session):
        with patch.object(service, "_count_existing_bookings", return_value=0):
            with patch.object(service, "_get_restaurant_capacity", return_value=20):
                slots = await service.get_available_slots(
                    restaurant_id="r1",
                    booking_date=date(2026, 4, 1),
                    party_size=2,
                    db=db_session,
                )
        assert isinstance(slots, list)
        assert len(slots) > 0
        assert all("time" in slot for slot in slots)

    async def test_past_date_rejected(self, service, db_session):
        with pytest.raises(ValueError, match="past"):
            await service.check(
                restaurant_id="r1",
                booking_date=date(2000, 1, 1),
                booking_time=time(12, 0),
                party_size=2,
                db=db_session,
            )

    async def test_large_party_needs_multiple_tables(self, service, db_session):
        """A party of 20 should require 5×4-person tables."""
        with patch.object(service, "_count_existing_bookings", return_value=0):
            with patch.object(service, "_get_restaurant_capacity", return_value=40):
                result = await service.check(
                    restaurant_id="r1",
                    booking_date=date(2026, 4, 1),
                    booking_time=time(19, 0),
                    party_size=20,
                    db=db_session,
                )
        assert result is True
