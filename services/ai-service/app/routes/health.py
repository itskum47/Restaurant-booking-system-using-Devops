from fastapi import APIRouter
from datetime import datetime
import os

router = APIRouter()

@router.get("/health")
async def health_check():
    """Health check endpoint for Kubernetes liveness probe."""
    return {
        "status": "healthy",
        "service": "ai-service",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@router.get("/ready")
async def readiness_check():
    """Readiness check endpoint for Kubernetes readiness probe."""
    # Check if OpenAI API key is configured (or using mock mode)
    openai_key = os.getenv("OPENAI_API_KEY", "mock")
    llm_ready = True  # Always ready, will fallback to mock if needed
    
    return {
        "status": "ready" if llm_ready else "not_ready",
        "service": "ai-service",
        "timestamp": datetime.utcnow().isoformat(),
        "llm_mode": "openai" if openai_key != "mock" else "mock",
        "checks": {
            "llm_connection": llm_ready
        }
    }
