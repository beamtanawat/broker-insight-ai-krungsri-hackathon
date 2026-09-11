"""
Request Tracing & Correlation Middleware.
Injects or propagates X-Request-ID and tracks precise response latency with X-Response-Time-MS.
"""
import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.metrics import metrics_collector


class RequestTracingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # Extract existing Request-ID or generate a new UUID
        request_id = request.headers.get("X-Request-ID") or request.headers.get("x-request-id") or str(uuid.uuid4())
        request.state.request_id = request_id

        start_time = time.perf_counter()
        response = await call_next(request)
        duration_sec = time.perf_counter() - start_time
        process_time_ms = duration_sec * 1000.0

        # Record into Prometheus metrics collector
        metrics_collector.record_http_request(
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_sec=duration_sec,
        )

        # Attach tracing headers to response
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time-MS"] = f"{process_time_ms:.2f}"

        return response
