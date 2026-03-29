from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.responses import PlainTextResponse
import time
import os
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST

from app.logging_config import configure_logging, get_logger
from app.middleware import CorrelationIDMiddleware
from app.routes import booking, health
from app.metrics.prometheus import metrics_middleware, metrics_endpoint
from app.services.llm_service import llm_service

# Initialise structured logging early
configure_logging()
logger = get_logger(__name__)

# Prometheus metrics for Gemini
gemini_requests_total = Counter(
    "gemini_requests_total",
    "Total Gemini API requests",
    ["intent_type", "status"]
)
gemini_latency_seconds = Histogram(
    "gemini_latency_seconds",
    "Gemini API latency",
    ["intent_type"],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0]
)
gemini_tokens_total = Counter(
    "gemini_tokens_total",
    "Total Gemini tokens used",
    ["direction"]
)
ai_service_ready = Gauge(
    "ai_service_ready",
    "AI service readiness (1=ready, 0=not ready)"
)

app = FastAPI(
    title="AI Booking Service",
    description="Google Gemini-powered natural language restaurant booking service",
    version="1.0.0"
)

# Set up distributed tracing (OTLP → Grafana Tempo)
from app.tracing import setup_tracing
setup_tracing(app, service_name="ai-service")

# Middleware — ordering matters: outmost first
app.add_middleware(CorrelationIDMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Metrics middleware
app.middleware("http")(metrics_middleware)

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(booking.router, prefix="/api/v1/ai", tags=["ai"])

# Metrics endpoint
@app.get("/metrics")
async def metrics():
    return PlainTextResponse(generate_latest(), media_type=CONTENT_TYPE_LATEST)

# Root endpoint
@app.get("/")
async def root():
    return {
        "service": "AI Booking Service",
        "version": "1.0.0",
        "engine": "Google Gemini",
        "model": os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
        "status": "running",
        "endpoints": {
            "health": "/health",
            "ready": "/ready",
            "metrics": "/metrics",
            "booking": "/api/v1/ai/booking",
            "recommendations": "/api/v1/ai/recommendations"
        }
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": str(exc),
            "path": str(request.url.path)
        }
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AI_SERVICE_PORT", "8001"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
