"""
Phase 33 Tests: Production Hardening, Observability, and Hybrid Caching.
Verifies Prometheus metrics exporter, CacheBackend interface with automatic fallback,
and clean modern validation handling.
"""
import pytest
import time
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.metrics import MetricsCollector, metrics_collector
from app.core.cache_backend import InMemoryCacheBackend, RedisCacheBackend, get_cache
from app.core.config import settings


@pytest.mark.asyncio
async def test_prometheus_metrics_endpoint_exposition():
    """Verify /metrics and /api/v1/metrics return valid Prometheus exposition format."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Trigger an initial request
        await client.get("/health/live")

        resp = await client.get("/metrics")
        assert resp.status_code == 200
        assert "text/plain" in resp.headers["content-type"]
        text = resp.text

        # Standard Prometheus tokens
        assert "# HELP process_uptime_seconds" in text
        assert "# TYPE process_uptime_seconds gauge" in text
        assert "process_uptime_seconds" in text

        assert "# HELP http_requests_total" in text
        assert "# TYPE http_requests_total counter" in text
        assert "http_requests_total" in text

        assert "# HELP http_request_duration_seconds" in text
        assert "# TYPE http_request_duration_seconds summary" in text

        assert "# HELP app_info" in text
        assert 'app_info{version="1.0.0",app="broker_insight_ai",environment="production_ready"} 1' in text

        # Check prefixed route as well
        resp_v1 = await client.get("/api/v1/metrics")
        assert resp_v1.status_code == 200


@pytest.mark.asyncio
async def test_metrics_collector_cardinality_normalization():
    """Verify that UUIDs and customer IDs are normalized to prevent cardinality explosion."""
    collector = MetricsCollector()
    collector.record_http_request("GET", "/customers/77d0b9f5-670e-4e97-a97c-29ea518d0245", 200, 0.012)
    collector.record_http_request("GET", "/customers/CUST-100234/analyze", 200, 0.035)

    text = collector.generate_prometheus_text()
    assert 'endpoint="/customers/:id"' in text
    assert 'endpoint="/customers/:id/analyze"' in text
    # Ensure raw UUIDs are not leaked as separate metric dimensions
    assert "77d0b9f5-670e-4e97-a97c-29ea518d0245" not in text


@pytest.mark.asyncio
async def test_in_memory_cache_backend_lifecycle():
    """Verify In-Memory cache backend get, set, TTL expiry, delete, and stats."""
    cache = InMemoryCacheBackend()
    
    # 1. Set & Get
    await cache.set("test_key_1", {"msg": "hello", "score": 95}, ttl_seconds=10)
    val = await cache.get("test_key_1")
    assert val is not None
    assert val["msg"] == "hello"
    assert val["score"] == 95

    # 2. Stats
    stats = cache.get_stats()
    assert stats["backend"] == "in_memory"
    assert stats["hits"] >= 1
    assert stats["status"] == "healthy"

    # 3. Delete
    deleted = await cache.delete("test_key_1")
    assert deleted is True
    assert await cache.get("test_key_1") is None

    # 4. TTL Expiry
    await cache.set("quick_key", {"data": 123}, ttl_seconds=0)  # expires immediately
    time.sleep(0.01)
    expired_val = await cache.get("quick_key")
    assert expired_val is None


@pytest.mark.asyncio
async def test_redis_cache_backend_graceful_fallback():
    """Verify RedisCacheBackend falls back to in-memory gracefully when Redis is not running."""
    # Point to non-existent redis instance
    redis_cache = RedisCacheBackend(redis_url="redis://127.0.0.1:63799/0")
    
    # Operations should succeed without throwing exceptions via fallback
    success = await redis_cache.set("fallback_test", {"status": "ok"}, ttl_seconds=60)
    assert success is True

    val = await redis_cache.get("fallback_test")
    assert val is not None
    assert val["status"] == "ok"

    stats = redis_cache.get_stats()
    assert "fallback_stats" in stats


@pytest.mark.asyncio
async def test_cache_factory_resolution():
    """Verify get_cache() returns healthy CacheBackend singleton."""
    cache = get_cache()
    assert cache is not None
    assert hasattr(cache, "get")
    assert hasattr(cache, "set")


@pytest.mark.asyncio
async def test_validation_error_handler_status_and_structure():
    """Verify payload validation errors return clean 422 response with errors list."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Send malformed JSON to login endpoint
        resp = await client.post("/auth/login", json={"invalid_field": 123})
        assert resp.status_code == 422
        data = resp.json()
        assert "detail" in data
        assert "errors" in data
