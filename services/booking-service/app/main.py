from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST, Counter, Histogram, Gauge
from contextlib import asynccontextmanager
import os

from app.logging_config import configure_logging, get_logger
from app.middleware import CorrelationIDMiddleware
from app.routes import bookings, payments, dashboard
from app.db.mongo import close_mongo_connection, connect_to_mongo

# Initialise structured logging early — before anything uses the logger
configure_logging()
logger = get_logger(__name__)

# Prometheus metrics
bookings_created_total = Counter(
    'bookings_created_total',
    'Total number of bookings created',
    ['cuisine_type', 'party_size_bucket']
)

bookings_cancelled_total = Counter(
    'bookings_cancelled_total',
    'Total number of bookings cancelled',
    ['reason']
)

booking_processing_duration = Histogram(
    'booking_processing_duration_seconds',
    'Booking processing duration in seconds',
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0]
)

active_bookings_total = Gauge(
    'active_bookings_total',
    'Total number of active bookings'
)

# Make metrics globally accessible
import app.routes.bookings as booking_routes
booking_routes.bookings_created_total = bookings_created_total
booking_routes.bookings_cancelled_total = bookings_cancelled_total
booking_routes.booking_processing_duration = booking_processing_duration
booking_routes.active_bookings_total = active_bookings_total

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()

app = FastAPI(
    title="Booking Service",
    description="Restaurant booking management service",
    version="1.0.0",
    lifespan=lifespan
)

# Set up distributed tracing (OTLP → Grafana Tempo)
from app.tracing import setup_tracing
setup_tracing(app, service_name="booking-service")

# Middleware — ordering matters: outmost first
app.add_middleware(CorrelationIDMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(bookings.router, prefix="/api/v1/bookings", tags=["bookings"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["payments"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])

# Health endpoints
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "booking-service",
        "version": "1.0.0"
    }

@app.get("/ready")
async def readiness_check():
    from app.db.mongo import get_database
    try:
        db = get_database()
        # Ping database
        await db.command('ping')
        return {
            "status": "ready",
            "service": "booking-service",
            "database": "connected"
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "service": "booking-service",
                "database": "disconnected",
                "error": str(e)
            }
        )

@app.get("/metrics")
async def metrics():
    from fastapi import Response
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )

@app.get("/")
async def root():
    return {
        "service": "Booking Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "ready": "/ready",
            "metrics": "/metrics",
            "bookings": "/api/v1/bookings",
            "payments": "/api/v1/payments",
            "dashboard": "/api/v1/dashboard"
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BOOKING_SERVICE_PORT", "8002"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
# openapi swagger
