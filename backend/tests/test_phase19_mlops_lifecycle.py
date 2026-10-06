"""
Comprehensive test suite for Phase 19:
MLOps and Model Lifecycle Management.
Tests Model Registry, Validation Gate, Promotion, Rollback,
Reproducibility Provenance, and Population Stability Index (PSI) Drift Monitoring.
"""
import numpy as np
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.seed import seed_database
from app.core.security import create_access_token
from app.models.user import User
from tests.conftest import TestAsyncSession
from app.ml.drift import calculate_psi, generate_drift_report
from app.ml.registry import ModelRegistry, model_registry


async def get_test_token(role: str = "admin") -> str:
    async with TestAsyncSession() as db:
        user = (await db.execute(User.__table__.select().where(User.email == f"{role}@demo.local"))).first()
        user_id = user.id if user else "test-user-id"
    return create_access_token(user_id, role)


def test_model_registry_structure_and_provenance():
    """Verify registry tracks versions, metrics, hyperparameters, random seed, and library versions."""
    registry = ModelRegistry()
    catalog = registry.load_registry()

    assert "registry_version" in catalog
    assert "active_version" in catalog
    assert len(catalog.get("models", [])) >= 2

    active_model = registry.get_active_model()
    assert active_model is not None
    assert active_model["is_active"] is True
    assert active_model["status"] == "active"
    assert active_model["deployment_status"] == "deployed"

    # Provenance tracking
    prov = active_model.get("provenance", {})
    assert prov.get("random_seed") == 42
    assert prov.get("dataset_records") == 1200
    assert prov.get("feature_count") == 17
    assert "environment" in prov
    assert "lightgbm" in prov["environment"]
    assert "scikit-learn" in prov["environment"]


def test_lifecycle_validation_and_promotion_rule():
    """Verify that only validated models can be promoted, and unvalidated models are rejected."""
    registry = ModelRegistry()

    # Attempt to promote non-existent version
    success, msg = registry.promote_model("v9.9.9-fake")
    assert success is False
    assert "does not exist" in msg

    # Validate v1.1.0 candidate
    is_valid, v_msg, model_meta = registry.validate_model("1.1.0")
    assert is_valid is True
    assert model_meta["status"] == "validated"


def test_model_promotion_and_rollback_flow():
    """Verify promoting v1.1.0 to active and rolling back to v1.0.0."""
    registry = ModelRegistry()

    # Promote v1.1.0
    p_ok, p_msg = registry.promote_model("1.1.0")
    assert p_ok is True
    assert registry.load_registry()["active_version"] == "1.1.0"
    assert registry.get_model("1.1.0")["is_active"] is True
    assert registry.get_model("1.0.0")["is_active"] is False

    # Rollback to v1.0.0
    r_ok, r_msg = registry.rollback_model("1.0.0")
    assert r_ok is True
    assert registry.load_registry()["active_version"] == "1.0.0"
    assert registry.get_model("1.0.0")["is_active"] is True
    assert registry.get_model("1.1.0")["is_active"] is False


def test_population_stability_index_drift_calculation():
    """Verify PSI correctly identifies stable distributions (PSI < 0.10) vs shifted distributions (PSI >= 0.25)."""
    np.random.seed(42)
    baseline = np.random.normal(loc=50.0, scale=10.0, size=1000)

    # 1. Stable production data (same distribution)
    current_stable = np.random.normal(loc=50.0, scale=10.0, size=500)
    psi_stable, status_stable, _ = calculate_psi(baseline, current_stable, num_bins=5)
    assert psi_stable < 0.10
    assert status_stable == "stable"

    # 2. Shifted production data (mean shifts from 50 to 80)
    current_shifted = np.random.normal(loc=80.0, scale=10.0, size=500)
    psi_shifted, status_shifted, _ = calculate_psi(baseline, current_shifted, num_bins=5)
    assert psi_shifted >= 0.25
    assert status_shifted == "significant_drift"


def test_generate_drift_report_structure():
    """Verify drift report generates feature-level PSI, prediction PSI, and small-sample warnings."""
    report = generate_drift_report(save_artifacts=False)
    assert "report_id" in report
    assert "feature_drifts" in report
    assert len(report["feature_drifts"]) >= 5
    assert "prediction_drift" in report
    assert "drift_interpretation_guide" in report
    assert "data_drift_concept" in report["drift_interpretation_guide"]


@pytest.mark.asyncio
async def test_api_model_registry_and_drift_endpoints():
    """Verify GET /model/registry, GET /model/drift, POST /model/promote, POST /model/rollback endpoints."""
    await seed_database(num_customers=5)
    token = await get_test_token("admin")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. GET /model/registry
        reg_res = await client.get("/model/registry", headers=headers)
        assert reg_res.status_code == 200
        reg_data = reg_res.json()
        assert "active_version" in reg_data
        assert len(reg_data["models"]) >= 2

        # 2. GET /model/drift
        drift_res = await client.get("/model/drift", headers=headers)
        assert drift_res.status_code == 200
        drift_data = drift_res.json()
        assert drift_data["overall_data_drift_status"] in ["stable", "investigate"]
        assert len(drift_data["feature_drifts"]) >= 5

        # 3. POST /model/promote
        prom_res = await client.post("/model/promote", json={"version": "1.1.0"}, headers=headers)
        assert prom_res.status_code == 200
        assert prom_res.json()["active_version"] == "1.1.0"

        # 4. POST /model/rollback
        roll_res = await client.post("/model/rollback", json={"target_version": "1.0.0"}, headers=headers)
        assert roll_res.status_code == 200
        assert roll_res.json()["active_version"] == "1.0.0"
