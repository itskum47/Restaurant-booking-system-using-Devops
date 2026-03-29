"""
Shared pytest fixtures for booking-service tests.
"""
import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from unittest.mock import AsyncMock, patch

from app.main import app
from app.database import Base, get_db
from app.config import Settings


TEST_DATABASE_URL = "postgresql+asyncpg://test_user:test_password@localhost:5432/test_db"


@pytest.fixture(scope="session")
def event_loop():
    """Create a single event loop for the entire test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def engine():
    _engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield _engine
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await _engine.dispose()


@pytest_asyncio.fixture
async def db_session(engine):
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session):
    """HTTP test client with overridden DB dependency."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
def mock_redis():
    with patch("app.cache.redis_client") as mock:
        mock.get = AsyncMock(return_value=None)
        mock.setex = AsyncMock(return_value=True)
        mock.delete = AsyncMock(return_value=1)
        yield mock


@pytest.fixture
def sample_booking_payload():
    return {
        "restaurant_id": "restaurant-001",
        "date": "2026-04-01",
        "time": "19:00",
        "party_size": 4,
        "special_requests": "Window seat preferred",
    }


@pytest.fixture
def auth_headers():
    """JWT headers for an authenticated test user."""
    import jwt
    token = jwt.encode(
        {"sub": "user-test-001", "email": "test@example.com", "exp": 9999999999},
        "test-secret-key-for-ci",
        algorithm="HS256",
    )
    return {"Authorization": f"Bearer {token}"}
