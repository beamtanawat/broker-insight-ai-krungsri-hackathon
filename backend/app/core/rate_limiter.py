"""
Lightweight sliding window rate limiter for security hardening (Phase 33).
Protects sensitive endpoints (Login, AI Scoring, Conversation Assistant) from abuse.
Supports In-Memory and Redis backends with automatic graceful fallback.
"""
import time
from collections import defaultdict
from typing import Dict, List, Optional
from fastapi import HTTPException, Request, status
import structlog

from app.core.config import settings

logger = structlog.get_logger()

# In-memory store: key -> list of timestamps
_RATE_LIMIT_STORE: Dict[str, List[float]] = defaultdict(list)


def rate_limit(max_requests: int = 30, window_seconds: int = 60, key_prefix: str = "global"):
    """
    FastAPI dependency for sliding-window rate limiting.
    Raises HTTP 429 Too Many Requests when limit exceeded.
    Supports in-memory and Redis distributed rate-limiting.
    """
    async def limiter(request: Request):
        # Identify caller via client IP or authorization header if present
        client_ip = request.client.host if request.client else "unknown"
        auth_header = request.headers.get("Authorization", "")
        caller_id = f"{key_prefix}:{auth_header[:20] if auth_header else client_ip}"

        now = time.time()
        window_start = now - window_seconds

        # 1. Try Redis sliding window if configured
        if getattr(settings, "CACHE_BACKEND", "memory").lower() == "redis" and getattr(settings, "REDIS_URL", ""):
            try:
                import redis.asyncio as aioredis
                r = aioredis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=1.0)
                pipe = r.pipeline()
                pipe.zremrangebyscore(caller_id, 0, window_start)
                pipe.zcard(caller_id)
                pipe.zadd(caller_id, {str(now): now})
                pipe.expire(caller_id, window_seconds + 10)
                results = await pipe.execute()
                await r.close()

                req_count = results[1]
                if req_count >= max_requests:
                    logger.warning(
                        "redis_rate_limit_exceeded",
                        caller=caller_id,
                        path=request.url.path,
                        count=req_count,
                        limit=max_requests,
                    )
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail=f"Rate limit exceeded. Maximum {max_requests} requests per {window_seconds} seconds. Please slow down.",
                    )
                return
            except HTTPException:
                raise
            except Exception as e:
                # Fallback gracefully to in-memory store
                logger.debug("redis_rate_limit_fallback_to_memory", error=str(e))

        # 2. In-memory sliding window
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
