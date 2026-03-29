import uuid
import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = structlog.get_logger(__name__)


class CorrelationIDMiddleware(BaseHTTPMiddleware):
    """
    Propagates or generates a correlation ID for every request.
    Binds it (plus method/path/service) to structlog contextvars so every log
    line emitted during the request lifetime automatically includes it.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        correlation_id = request.headers.get("x-correlation-id", str(uuid.uuid4()))

        # Bind contextual fields for the life of this request
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            correlation_id=correlation_id,
            service=getattr(request.app, "title", "booking-service"),
            method=request.method,
            path=str(request.url.path),
        )

        response = await call_next(request)

        # Echo the correlation ID back so callers can trace requests
        response.headers["x-correlation-id"] = correlation_id

        logger.info(
            "request_completed",
            status_code=response.status_code,
        )
        return response
