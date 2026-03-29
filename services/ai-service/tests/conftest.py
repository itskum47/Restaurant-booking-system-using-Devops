"""
conftest.py for ai-service tests.
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, patch


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
def mock_gemini_api_key(monkeypatch):
    """Prevent tests from needing a real Gemini key."""
    monkeypatch.setenv("GEMINI_API_KEY", "mock-gemini-key-for-testing")
    monkeypatch.setenv("GROQ_API_KEY", "mock-groq-key-for-testing")
    monkeypatch.setenv("JWT_SECRET", "test-secret-key-for-ci")


@pytest.fixture
def sample_preferences():
    return {
        "cuisine": "Italian",
        "mood": "romantic",
        "dietary_restrictions": ["gluten-free"],
        "budget": "moderate",
    }
