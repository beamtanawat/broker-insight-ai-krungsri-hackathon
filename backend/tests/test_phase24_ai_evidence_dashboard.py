"""
Phase 24 Test Suite: AI Performance & Evidence Dashboard APIs, RBAC, and Data Consistency.
"""
import json
from pathlib import Path
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.security import create_access_token
from app.core.seed import seed_database
from app.models.user import User
from tests.conftest import TestAsyncSession
from app.services.monitoring_service import monitoring_service

EXPERIMENTS_DIR = Path(__file__).parents[1] / "app" / "ml" / "experiments"


async def get_test_token(role: str = "broker") -> str:
    await seed_database(num_customers=5)
    async with TestAsyncSession() as db:
        user = (await db.execute(User.__table__.select().where(User.email == f"{role}@demo.local"))).first()
        user_id = user.id if user else "test-user-id"
    return create_access_token(user_id, role)


@pytest.mark.asyncio
async def test_evidence_summary_endpoint():
    """Verifies GET /model/evidence returns complete executive evidence summary."""
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/model/evidence", headers=headers)
        assert res.status_code == 200
        data = res.json()

        assert data["active_champion"] == "LightGBM Priority Classifier"
        assert data["model_version"] == "1.0.0"
        assert "metrics" in data
        assert data["metrics"]["f1_score"] >= 0.80
        assert data["metrics"]["roc_auc"] >= 0.90
        assert "calibration" in data
        assert data["calibration"]["expected_calibration_error"] <= 0.06
        assert "latency" in data
        assert data["latency"]["total_inference_latency_ms"] <= 20.0
        assert "candidate_comparison" in data
        assert len(data["candidate_comparison"]) >= 2


@pytest.mark.asyncio
async def test_error_analysis_endpoint():
    """Verifies GET /model/errors returns deep error diagnosis and group profiles."""
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/model/errors", headers=headers)
        assert res.status_code == 200
        data = res.json()

        assert data["total_test_samples"] == 240
        breakdown = data["confusion_breakdown"]
        assert "True_Positive" in breakdown
        assert "False_Positive" in breakdown
        assert "False_Negative" in breakdown
        assert "True_Negative" in breakdown
        assert "group_feature_profiles" in data
        assert "score_band_error_concentration" in data


@pytest.mark.asyncio
async def test_threshold_analysis_endpoint():
    """Verifies GET /model/threshold-analysis returns validation grid and selected threshold."""
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/model/threshold-analysis", headers=headers)
        assert res.status_code == 200
        data = res.json()

        assert len(data["cv_grid_results"]) >= 15
        assert data["selected_threshold"] == 0.35
        assert "selection_rationale" in data
        assert data["holdout_test_result_at_selected_threshold"]["recall"] >= 0.85


@pytest.mark.asyncio
async def test_feature_analysis_endpoint():
    """Verifies GET /model/features returns split importances, SHAP values, and 4 ablation suites."""
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/model/features", headers=headers)
        assert res.status_code == 200
        data = res.json()

        assert len(data["feature_split_importance"]) == 17
        assert len(data["feature_shap_importance"]) == 17
        abl = data["ablation_experiments"]
        assert "Ablation 1 (Baseline - All 17 Features)" in abl
        assert "Ablation 2 (Without Engagement/Contact Features)" in abl
        assert "Ablation 3 (Without Insurance History Features)" in abl
        assert "Ablation 4 (Financial & Demographics Only)" in abl


@pytest.mark.asyncio
async def test_latency_benchmark_endpoint():
    """Verifies GET /model/latency returns prediction and SHAP calculation latency."""
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/model/latency", headers=headers)
        assert res.status_code == 200
        data = res.json()

        assert data["benchmark_iterations"] >= 100
        assert data["single_sample_prediction_latency_ms"] <= 20.0
        assert data["single_sample_shap_latency_ms"] <= 20.0
        assert 0.0 <= data["shap_overhead_percentage"] <= 100.0


@pytest.mark.asyncio
async def test_evidence_endpoints_unauthenticated_rejection():
    """Verifies unauthenticated calls to all evidence endpoints receive HTTP 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        endpoints = [
            "/api/v1/model/evidence",
            "/api/v1/model/errors",
            "/api/v1/model/threshold-analysis",
            "/api/v1/model/features",
            "/api/v1/model/latency",
        ]
        for ep in endpoints:
            res = await client.get(ep)
            assert res.status_code == 401, f"{ep} must reject unauthenticated requests"


@pytest.mark.asyncio
async def test_data_consistency_between_endpoints_and_artifacts():
    """Verifies API responses match the exact values stored in experiment files."""
    with open(EXPERIMENTS_DIR / "baseline.json", "r", encoding="utf-8") as f:
        base_file = json.load(f)

    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/model/evidence", headers=headers)
        assert res.status_code == 200
        api_data = res.json()

        assert api_data["metrics"]["f1_score"] == base_file["test_metrics"]["f1_score"]
        assert api_data["metrics"]["roc_auc"] == base_file["test_metrics"]["roc_auc"]
        assert api_data["calibration"]["brier_score"] == base_file["test_metrics"]["brier_score"]

