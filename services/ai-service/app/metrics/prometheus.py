from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Request, Response
import time

# Custom Prometheus metrics for AI service
ai_requests_total = Counter(
    'ai_requests_total',
    'Total number of AI requests',
    ['intent_type', 'status']
)

ai_inference_duration = Histogram(
    'ai_inference_duration_seconds',
    'AI inference duration in seconds',
    ['intent_type'],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0]
)

booking_recommendations_total = Counter(
    'booking_recommendations_total',
    'Total number of booking recommendations',
    ['cuisine_type']
)

llm_tokens_used_total = Counter(
    'llm_tokens_used_total',
    'Total number of LLM tokens used',
    ['model']
)

ai_service_up = Gauge(
    'ai_service_up',
    'AI service availability'
)

# Set service as up
ai_service_up.set(1)

async def metrics_middleware(request: Request, call_next):
    """Middleware to collect request metrics."""
    # Skip metrics for /metrics endpoint itself
    if request.url.path == "/metrics":
        return await call_next(request)
    
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    # You can add additional metrics here if needed
    
    return response

async def metrics_endpoint():
    """Prometheus metrics endpoint."""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )
