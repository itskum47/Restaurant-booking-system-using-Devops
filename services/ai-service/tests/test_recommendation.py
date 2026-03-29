"""
Unit tests for AI recommendation service.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.services.recommendation import RecommendationService


class TestRecommendationEndpoint:
    @pytest.fixture
    def mock_gemini(self):
        with patch("app.services.recommendation.genai") as mock:
            mock_model = MagicMock()
            mock_model.generate_content_async = AsyncMock(
                return_value=MagicMock(
                    text='{"recommendations": [{"name": "Table for Two", "reason": "Romantic corner spot"}]}'
                )
            )
            mock.GenerativeModel.return_value = mock_model
            yield mock

    async def test_recommendations_returned(self, mock_gemini):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/recommendations",
                json={
                    "restaurant_id": "r1",
                    "user_preferences": {"cuisine": "Italian", "mood": "romantic"},
                    "party_size": 2,
                },
                headers={"Authorization": "Bearer test-token"},
            )
        assert response.status_code == 200
        body = response.json()
        assert "recommendations" in body
        assert len(body["recommendations"]) > 0

    async def test_recommendations_fallback_to_groq(self, mock_gemini):
        """When Gemini fails, service should fall back to Groq."""
        mock_gemini.GenerativeModel.return_value.generate_content_async.side_effect = Exception("API error")

        with patch("app.services.recommendation.GroqClient") as mock_groq:
            mock_groq.return_value.chat = AsyncMock(
                return_value=MagicMock(
                    choices=[MagicMock(message=MagicMock(content='{"recommendations": []}'))]
                )
            )
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    "/api/v1/recommendations",
                    json={"restaurant_id": "r1", "user_preferences": {}, "party_size": 2},
                    headers={"Authorization": "Bearer test-token"},
                )
        assert response.status_code == 200

    async def test_health_check(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestRecommendationService:
    @pytest.fixture
    def service(self):
        return RecommendationService()

    async def test_build_prompt_includes_preferences(self, service):
        prompt = service._build_prompt(
            restaurant_id="r1",
            preferences={"cuisine": "Italian"},
            party_size=4,
        )
        assert "Italian" in prompt
        assert "4" in prompt
        assert "restaurant" in prompt.lower()

    async def test_parse_valid_json_response(self, service):
        raw = '{"recommendations": [{"name": "A", "reason": "great"}]}'
        result = service._parse_response(raw)
        assert len(result) == 1
        assert result[0]["name"] == "A"

    async def test_parse_malformed_response_returns_empty(self, service):
        result = service._parse_response("not valid json {{{")
        assert result == []

    async def test_rate_limit_enforced(self, service):
        """Service should raise RateLimitError after max calls."""
        with patch.object(service, "_call_count", 1000):
            with pytest.raises(Exception):
                await service.recommend("r1", {}, 2)
