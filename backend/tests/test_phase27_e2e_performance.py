"""
Automated Test Suite for Phase 27: End-to-End Benchmark & Performance Optimization.
Tests request tracing headers, benchmark execution, response schemas,
concurrency matrix, component breakdowns, and budget compliance.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.ml.e2e_benchmark import (
    run_e2e_system_benchmark,
    measure_component_latencies,
    E2E_BASELINE_PATH,
    E2E_OPTIMIZED_PATH,
)
from app.services.monitoring_service import monitoring_service


@pytest.mark.asyncio
async def test_request_tracing_middleware_headers():
    """Verify that X-Request-ID and X-Response-Time-MS headers are attached to every response."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Without incoming request ID
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert "x-request-id" in resp.headers
        assert "x-response-time-ms" in resp.headers
        latency = float(resp.headers["x-response-time-ms"])
        assert latency >= 0.0

        # 2. With propagated incoming request ID
        custom_id = "test-req-trace-12345"
        resp2 = await client.get("/health", headers={"X-Request-ID": custom_id})
        assert resp2.status_code == 200
        assert resp2.headers["x-request-id"] == custom_id


def test_measure_component_latencies():
    """Verify isolated component latency breakdown profiling."""
    comp = measure_component_latencies(iterations=10)
    assert "database_ms" in comp
    assert "ml_pipeline_ms" in comp
    assert "shap_explainability_ms" in comp
    assert "llm_cold_ms" in comp
    assert "llm_warm_cached_ms" in comp
    assert "recommendation_ms" in comp
    assert "serialization_ms" in comp

    # Warm cache should be significantly faster than cold
    assert comp["llm_warm_cached_ms"]["avg"] < comp["llm_cold_ms"]["avg"]
    # All latencies must be positive
    for k, v in comp.items():
        assert v["avg"] >= 0.0
        assert v["p50"] >= 0.0


def test_run_e2e_system_benchmark_execution():
    """Verify full 10-step E2E benchmark execution and artifact persistence."""
    result = run_e2e_system_benchmark(save_artifacts=True)
    assert result["decision"] == "OPTIMIZED_BENCHMARK_PROMOTED"
    assert E2E_BASELINE_PATH.exists()
    assert E2E_OPTIMIZED_PATH.exists()

    opt = result["optimized"]
    assert opt["status"] == "promoted_champion"
    assert len(opt["steps_cold"]) == 10
    assert len(opt["steps_warm"]) == 10
    assert len(opt["concurrency_scaling"]) >= 5
    assert len(opt["bottleneck_ranking"]) >= 5
    assert len(opt["performance_budgets"]) >= 5


def test_e2e_concurrency_scaling_matrix():
    """Verify concurrency scaling attributes and monotonic throughput trend."""
    metrics = monitoring_service.get_e2e_performance_metrics()
    scaling = metrics["concurrency_scaling"]

    concurrencies = [item["concurrency"] for item in scaling]
    throughputs = [item["throughput_req_per_sec"] for item in scaling]
    error_rates = [item["error_rate_pct"] for item in scaling]

    assert 1 in concurrencies
    assert 50 in concurrencies
    # Throughput should scale upwards
    assert throughputs[-1] > throughputs[0]
    # Error rate under local benchmark must be 0
    for err in error_rates:
        assert err == 0.0


def test_e2e_performance_budgets_compliance():
    """Verify that all performance budget targets pass."""
    metrics = monitoring_service.get_e2e_performance_metrics()
    budgets = metrics["performance_budgets"]

    for b in budgets:
        assert b["actual_avg_ms"] <= b["target_budget_ms"]
        assert "PASS" in b["status"]


from app.core.security import create_access_token
from app.core.seed import seed_database
from app.models.user import User
from tests.conftest import TestAsyncSession


async def get_test_token(role: str = "broker") -> str:
    await seed_database(num_customers=5)
    async with TestAsyncSession() as db:
        user = (await db.execute(User.__table__.select().where(User.email == f"{role}@demo.local"))).first()
        user_id = user.id if user else "test-user-id"
    return create_access_token(user_id, role)


@pytest.mark.asyncio
async def test_get_e2e_performance_api_endpoint():
    """Verify GET /api/v1/model/e2e-performance REST endpoint."""
    token = await get_test_token("broker")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/model/e2e-performance", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        data = resp.json()

        assert data["benchmark_name"] == "E2E Optimized v1.1"
        assert data["status"] == "promoted_champion"
        assert "workflow_summary" in data
        assert data["workflow_summary"]["error_rate_pct"] == 0.0
        assert data["workflow_summary"]["total_warm_latency_ms"] < data["workflow_summary"]["total_cold_latency_ms"]
        assert "component_breakdown" in data
        assert "steps_cold" in data
        assert "steps_warm" in data
        assert "concurrency_scaling" in data
        assert "bottleneck_ranking" in data
        assert "performance_budgets" in data


@pytest.mark.asyncio
async def test_e2e_performance_api_unauthorized():
    """Verify that unauthenticated requests to /e2e-performance are rejected."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/model/e2e-performance")
        assert resp.status_code == 401
