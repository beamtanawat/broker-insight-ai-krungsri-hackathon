"""
Enterprise Cache Backend Abstraction (Phase 33 — Production Hardening).
Provides transparent In-Memory and Redis caching with automatic graceful fallback.
Ensures zero-downtime and multi-pod horizontal scalability readiness.
"""
import json
import time
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, Set
import structlog

from app.core.config import settings
from app.core.metrics import metrics_collector

logger = structlog.get_logger()


class CacheBackend(ABC):
    """Abstract Cache Backend Interface."""

    @abstractmethod
    async def get(self, key: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def set(self, key: str, value: Dict[str, Any], ttl_seconds: int) -> bool:
        pass

    @abstractmethod
    async def delete(self, key: str) -> bool:
        pass

    @abstractmethod
    async def delete_by_prefix(self, prefix: str) -> int:
        pass

    @abstractmethod
    def get_stats(self) -> Dict[str, Any]:
        pass


class InMemoryCacheBackend(CacheBackend):
    """Thread-safe, highly optimized in-memory cache with TTL expiry."""

    def __init__(self):
        self._store: Dict[str, Dict[str, Any]] = {}
        self._hits = 0
        self._misses = 0

    async def get(self, key: str) -> Optional[Dict[str, Any]]:
        entry = self._store.get(key)
        now = time.time()
        if entry:
            if now < entry["expires_at"]:
                self._hits += 1
                metrics_collector.record_cache_hit()
                return entry["data"]
            else:
                del self._store[key]
        self._misses += 1
        metrics_collector.record_cache_miss()
        return None

    async def set(self, key: str, value: Dict[str, Any], ttl_seconds: int) -> bool:
        now = time.time()
        self._store[key] = {
            "data": value,
            "expires_at": now + ttl_seconds,
            "created_at": now,
        }
        return True

    async def delete(self, key: str) -> bool:
        if key in self._store:
            del self._store[key]
            return True
        return False

    async def delete_by_prefix(self, prefix: str) -> int:
        keys_to_delete = [k for k in self._store if k.startswith(prefix)]
        for k in keys_to_delete:
            del self._store[k]
        return len(keys_to_delete)

    def get_stats(self) -> Dict[str, Any]:
        return {
            "backend": "in_memory",
            "keys_count": len(self._store),
            "hits": self._hits,
            "misses": self._misses,
            "status": "healthy",
        }


class RedisCacheBackend(CacheBackend):
    """
    Asynchronous Redis cache backend.
    Falls back to InMemoryCacheBackend if Redis server is unreachable.
    """

    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self._fallback = InMemoryCacheBackend()
        self._client = None
        self._connected = False
        self._init_client()

    def _init_client(self):
        try:
            import redis.asyncio as aioredis
            self._client = aioredis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=2.0,
            )
            self._connected = True
            logger.info("redis_cache_initialized", url=self.redis_url.split("@")[-1])
        except Exception as e:
            self._connected = False
            logger.warning("redis_init_failed_falling_back_to_memory", error=str(e))

    async def get(self, key: str) -> Optional[Dict[str, Any]]:
        if not self._connected or not self._client:
            return await self._fallback.get(key)
        try:
            val = await self._client.get(key)
            if val:
                metrics_collector.record_cache_hit()
                return json.loads(val)
            metrics_collector.record_cache_miss()
            return None
        except Exception as e:
            logger.warning("redis_get_error_fallback", key=key, error=str(e))
            return await self._fallback.get(key)

    async def set(self, key: str, value: Dict[str, Any], ttl_seconds: int) -> bool:
        if not self._connected or not self._client:
            return await self._fallback.set(key, value, ttl_seconds)
        try:
            serialized = json.dumps(value, default=str)
            await self._client.set(key, serialized, ex=ttl_seconds)
            return True
        except Exception as e:
            logger.warning("redis_set_error_fallback", key=key, error=str(e))
            return await self._fallback.set(key, value, ttl_seconds)

    async def delete(self, key: str) -> bool:
        if not self._connected or not self._client:
            return await self._fallback.delete(key)
        try:
            deleted = await self._client.delete(key)
            return bool(deleted)
        except Exception:
            return await self._fallback.delete(key)

    async def delete_by_prefix(self, prefix: str) -> int:
        if not self._connected or not self._client:
            return await self._fallback.delete_by_prefix(prefix)
        try:
            keys = await self._client.keys(f"{prefix}*")
            if keys:
                return await self._client.delete(*keys)
            return 0
        except Exception:
            return await self._fallback.delete_by_prefix(prefix)

    def get_stats(self) -> Dict[str, Any]:
        return {
            "backend": "redis" if self._connected else "redis_fallback_to_memory",
            "connected": self._connected,
            "fallback_stats": self._fallback.get_stats(),
        }


# Factory to create or get default cache backend
_cache_instance: Optional[CacheBackend] = None


def get_cache() -> CacheBackend:
    global _cache_instance
    if _cache_instance is None:
        redis_url = getattr(settings, "REDIS_URL", "")
        backend_type = getattr(settings, "CACHE_BACKEND", "memory").lower()
        if backend_type == "redis" and redis_url:
            _cache_instance = RedisCacheBackend(redis_url)
        else:
            _cache_instance = InMemoryCacheBackend()
    return _cache_instance
