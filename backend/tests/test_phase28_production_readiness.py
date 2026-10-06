"""
Automated Test Suite for Phase 28: Production Readiness, Observability, and Metrics Consistency Audit.
Tests health probes (liveness/readiness), request tracing headers, RBAC security matrix,
safe error handling, failure mode resilience, and metrics consistency.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.security import create_access_token
from app.core.seed import seed_database
from app.models.user import User
from tests.conftest import TestAsyncSession
from app.ml.e2e_benchmark import E2E_OPTIMIZED_PATH
from app.ml.llm_optimizer import llm_cache


async def get_test_token(role: str = "broker") -> str:
    async with TestAsyncSession() as db:
        user = (await db.execute(User.__table__.select().where(User.email == f"{role}@demo.local"))).first()
        if not user:
            try:
                await seed_database(num_customers=5)
            except Exception:
                pass
            user = (await db.execute(User.__table__.select().where(User.email == f"{role}@demo.local"))).first()
        user_id = user.id if user else "test-user-id"
    return create_access_token(user_id, role)


@pytest.mark.asyncio
async def test_liveness_probe_endpoint():
    """Verify that /health/live returns HTTP 200 with alive status immediately."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health/live")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "alive"
        assert "service" in data
        assert "timestamp" in data


@pytest.mark.asyncio
async def test_readiness_probe_endpoint():
    """Verify that /health/ready returns HTTP 200 and validates live DB and ML model readiness."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health/ready")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ready"
        assert data["database"] == "connected"
        assert data["ml_model"]["ready"] is True


@pytest.mark.asyncio
async def test_consolidated_health_endpoint():
    """Verify that /health and /api/v1/health return ok status with model metadata."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        for path in ["/health", "/api/v1/health"]:
            resp = await client.get(path)
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "ok"
            assert data["database"] == "connected"
            assert "ml_model" in data


@pytest.mark.asyncio
async def test_request_tracing_on_errors():
    """Verify that even 404 / 401 error responses contain X-Request-ID and X-Response-Time-MS."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/non-existent-api-path-12345")
        assert resp.status_code == 404
        assert "x-request-id" in resp.headers
        assert "x-response-time-ms" in resp.headers


@pytest.mark.asyncio
async def test_rbac_security_matrix_enforcement():
    """Verify that unauthorized roles cannot access sensitive administrative or manager endpoints."""
    broker_token = await get_test_token("broker")
    admin_token = await get_test_token("admin")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Broker trying to access Admin-only Users list -> 403 Forbidden
        resp_broker = await client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {broker_token}"})
        assert resp_broker.status_code == 403

        # 2. Broker trying to promote ML model -> 403 Forbidden
        resp_promote = await client.post(
            "/api/v1/model/promote",
            headers={"Authorization": f"Bearer {broker_token}"},
            json={"version": "1.0.0"},
        )
        assert resp_promote.status_code == 403

        # 3. Admin accessing Admin-only Users list -> 200 OK
        resp_admin = await client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
        assert resp_admin.status_code == 200


@pytest.mark.asyncio
async def test_safe_error_handling_no_traceback_leak():
    """Verify that malformed requests return structured JSON without leaking Python traceback."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/v1/auth/login", json={"invalid_field": True})
        assert resp.status_code in [400, 422]
        body = resp.text
        assert "Traceback (most recent call last)" not in body
        assert "File \"/Users/" not in body


def test_metrics_consistency_source_of_truth():
    """Verify that E2E experiment artifact exists, is valid JSON, and has zero error rate."""
    import json
    assert E2E_OPTIMIZED_PATH.exists()
    with open(E2E_OPTIMIZED_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert data["benchmark_name"] == "E2E Optimized v1.1"
    assert data["workflow_summary"]["error_rate_pct"] == 0.0
    assert data["workflow_summary"]["total_warm_latency_ms"] < 50.0


def test_llm_cache_invalidation_on_customer_change():
    """Verify that updating a customer invalidates the cached LLM insights deterministically."""
    cust_id = "test-cust-cache-001"
    cust_data_v1 = {"age": 40, "income_range": "50,000", "score": 75}
    cust_data_v2 = {"age": 40, "income_range": "50,000", "score": 90}  # Changed score

    # Seed v1
    llm_cache.set(
        customer_id=cust_id,
        customer_data=cust_data_v1,
        task="insights",
        prompt_version="v2.0-optimized",
        model_version="gemini-1.5-flash",
        data={"summary": "v1 summary"},
    )
    hit_v1 = llm_cache.get(
        customer_id=cust_id,
        customer_data=cust_data_v1,
        task="insights",
        prompt_version="v2.0-optimized",
        model_version="gemini-1.5-flash",
    )
    assert hit_v1 is not None

    # Query with changed customer data -> Cache Miss due to SHA-256 Content-hash change
    hit_v2 = llm_cache.get(
        customer_id=cust_id,
        customer_data=cust_data_v2,
        task="insights",
        prompt_version="v2.0-optimized",
        model_version="gemini-1.5-flash",
    )
    assert hit_v2 is None
