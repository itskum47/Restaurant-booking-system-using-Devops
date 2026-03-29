"""
Integration tests for booking routes.
"""
import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch


class TestBookingCreation:
    async def test_create_booking_success(self, client: AsyncClient, auth_headers, sample_booking_payload, mock_redis):
        with patch("app.routes.bookings.check_availability", return_value=True):
            response = await client.post(
                "/api/v1/bookings",
                json=sample_booking_payload,
                headers=auth_headers,
            )
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "confirmed"
        assert data["restaurant_id"] == sample_booking_payload["restaurant_id"]
        assert "id" in data
        assert "confirmation_code" in data

    async def test_create_booking_unauthenticated(self, client: AsyncClient, sample_booking_payload):
        response = await client.post("/api/v1/bookings", json=sample_booking_payload)
        assert response.status_code == 401

    async def test_create_booking_invalid_payload(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/v1/bookings",
            json={"restaurant_id": "r1"},   # missing required fields
            headers=auth_headers,
        )
        assert response.status_code == 422

    async def test_create_booking_no_availability(self, client: AsyncClient, auth_headers, sample_booking_payload):
        with patch("app.routes.bookings.check_availability", return_value=False):
            response = await client.post(
                "/api/v1/bookings",
                json=sample_booking_payload,
                headers=auth_headers,
            )
        assert response.status_code == 409
        assert "not available" in response.json()["detail"].lower()

    async def test_create_booking_party_size_limit(self, client: AsyncClient, auth_headers, sample_booking_payload):
        payload = {**sample_booking_payload, "party_size": 100}
        response = await client.post("/api/v1/bookings", json=payload, headers=auth_headers)
        assert response.status_code == 422


class TestBookingRetrieval:
    async def test_get_booking_by_id(self, client: AsyncClient, auth_headers, sample_booking_payload, mock_redis):
        with patch("app.routes.bookings.check_availability", return_value=True):
            create_resp = await client.post(
                "/api/v1/bookings",
                json=sample_booking_payload,
                headers=auth_headers,
            )
        booking_id = create_resp.json()["id"]

        response = await client.get(f"/api/v1/bookings/{booking_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == booking_id

    async def test_get_booking_not_found(self, client: AsyncClient, auth_headers):
        response = await client.get("/api/v1/bookings/nonexistent-id", headers=auth_headers)
        assert response.status_code == 404

    async def test_get_user_bookings(self, client: AsyncClient, auth_headers):
        response = await client.get("/api/v1/bookings", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)


class TestBookingCancellation:
    async def test_cancel_booking(self, client: AsyncClient, auth_headers, sample_booking_payload, mock_redis):
        with patch("app.routes.bookings.check_availability", return_value=True):
            create_resp = await client.post(
                "/api/v1/bookings",
                json=sample_booking_payload,
                headers=auth_headers,
            )
        booking_id = create_resp.json()["id"]

        response = await client.delete(f"/api/v1/bookings/{booking_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["status"] == "cancelled"

    async def test_cancel_other_users_booking(self, client: AsyncClient, auth_headers):
        import jwt
        other_token = jwt.encode(
            {"sub": "other-user-999", "email": "other@example.com", "exp": 9999999999},
            "test-secret-key-for-ci",
            algorithm="HS256",
        )
        other_headers = {"Authorization": f"Bearer {other_token}"}

        response = await client.delete("/api/v1/bookings/some-booking-id", headers=other_headers)
        # Either 404 (not found for this user) or 403 (forbidden)
        assert response.status_code in (403, 404)


class TestHealthCheck:
    async def test_health_endpoint(self, client: AsyncClient):
        response = await client.get("/health")
        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "healthy"
        assert "version" in body
