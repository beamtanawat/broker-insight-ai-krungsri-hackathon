"""
Lightweight in-memory sliding window rate limiter for security hardening.
Protects sensitive endpoints (Login, AI Scoring, Conversation Assistant) from abuse.
"""
import time
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import HTTPException, Request, status
import structlog

logger = structlog.get_logger()

# In-memory store: key -> list of timestamps
_RATE_LIMIT_STORE: Dict[str, List[float]] = defaultdict(list)


def rate_limit(max_requests: int = 30, window_seconds: int = 60, key_prefix: str = "global"):
    """
    FastAPI dependency for sliding-window rate limiting.
    Raises HTTP 429 Too Many Requests when limit exceeded.
    """
    async def limiter(request: Request):
        # Identify caller via client IP or authorization header if present
        client_ip = request.client.host if request.client else "unknown"
        auth_header = request.headers.get("Authorization", "")
        caller_id = f"{key_prefix}:{auth_header[:20] if auth_header else client_ip}"

        now = time.time()
        window_start = now - window_seconds

        # Clean old timestamps
        timestamps = _RATE_LIMIT_STORE[caller_id]
        _RATE_LIMIT_STORE[caller_id] = [ts for ts in timestamps if ts > window_start]

        if len(_RATE_LIMIT_STORE[caller_id]) >= max_requests:
            logger.warning(
                "rate_limit_exceeded",
                caller=caller_id,
                path=request.url.path,
                count=len(_RATE_LIMIT_STORE[caller_id]),
                limit=max_requests,
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum {max_requests} requests per {window_seconds} seconds. Please slow down.",
            )

        _RATE_LIMIT_STORE[caller_id].append(now)

    return limiter
