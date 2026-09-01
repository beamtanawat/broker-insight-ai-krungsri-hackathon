"""
Comprehensive test suite for Phase 15:
Priority Score and Probability Calibration (Platt Sigmoid vs. Uncalibrated),
Expected Calibration Error (ECE), Brier Score, and Operating Threshold Mappings.
"""
import json
from pathlib import Path
import pytest
from httpx import AsyncClient, ASGITransport
import numpy as np

from app.main import app
from app.core.seed import seed_database
from app.core.security import create_access_token
from app.models.user import User
from app.models.customer import Customer
from app.ml.calibrate import (
    compute_expected_calibration_error,
    evaluate_calibration,
    map_probability_to_score_and_priority,
    train_calibrated_pipeline,
)
from app.ml.predict import predictor
from tests.conftest import TestAsyncSession

ARTIFACTS_DIR = Path(__file__).parent.parent / "app" / "ml" / "artifacts"


async def get_test_token(role: str = "broker") -> str:
    async with TestAsyncSession() as db:
        user = (await db.execute(User.__table__.select().where(User.email == f"{role}@demo.local"))).first()
        user_id = user.id if user else "test-user-id"
    return create_access_token(user_id, role)


def test_calibration_pipeline_execution_and_artifacts():
    """Verify calibrated pipeline runs, outputs metrics, and saves artifacts."""
    res = train_calibrated_pipeline(save_artifacts=True, n_samples=300)

    assert "calibration_id" in res
    assert res["selected_method"] == "platt_sigmoid"
    assert "methods_comparison" in res
    assert "score_thresholds" in res

    comp = res["methods_comparison"]
    assert "uncalibrated_lightgbm" in comp
    assert "platt_sigmoid" in comp
    assert "isotonic_regression" in comp

    for method_key, method_data in comp.items():
        metrics = method_data["metrics"]
        assert 0.0 <= metrics["brier_score"] <= 1.0
        assert metrics["log_loss"] >= 0.0
        assert 0.0 <= metrics["expected_calibration_error"] <= 1.0
        assert isinstance(metrics["calibration_curve"], list)

    cal_file = ARTIFACTS_DIR / "calibration_metrics.json"
    pkl_file = ARTIFACTS_DIR / "calibrator.pkl"
    assert cal_file.exists()
    assert pkl_file.exists()


def test_expected_calibration_error_and_brier_calculation():
    """Verify ECE and Brier score calculations on synthetic ground truth."""
    y_true = np.array([0, 0, 0, 1, 1, 1])
    y_prob = np.array([0.1, 0.2, 0.3, 0.7, 0.8, 0.9])

    ece = compute_expected_calibration_error(y_true, y_prob, n_bins=5)
    assert 0.0 <= ece <= 1.0

    eval_res = evaluate_calibration(y_true, y_prob, n_bins=3)
    assert 0.0 <= eval_res["brier_score"] <= 1.0
    assert eval_res["log_loss"] > 0.0
    assert len(eval_res["calibration_curve"]) > 0


def test_score_mapping_and_operating_thresholds():
    """Verify mapping probability to 0-100 display score and operating priority tiers."""
    # High Priority (>= 70)
    score_high, prio_high = map_probability_to_score_and_priority(0.82)
    assert score_high == 82
    assert prio_high == "high"

    # Medium Priority (40 - 69)
    score_med, prio_med = map_probability_to_score_and_priority(0.55)
    assert score_med == 55
    assert prio_med == "medium"

    # Low Priority (0 - 39)
    score_low, prio_low = map_probability_to_score_and_priority(0.25)
    assert score_low == 25
    assert prio_low == "low"

    # Edge cases
    score_min, prio_min = map_probability_to_score_and_priority(0.0)
    assert score_min == 0
    assert prio_min == "low"

    score_max, prio_max = map_probability_to_score_and_priority(1.0)
    assert score_max == 100
    assert prio_max == "high"


@pytest.mark.asyncio
async def test_predictor_calibrated_output():
    """Verify PriorityPredictor returns both raw and calibrated probability."""
    await seed_database(num_customers=3)

    async with TestAsyncSession() as db:
        customer = (await db.execute(Customer.__table__.select())).first()
        pred = predictor.predict_customer(customer)

    assert "probability" in pred
    assert "raw_probability" in pred
    assert "calibrated_probability" in pred
    assert "score" in pred
    assert "priority" in pred
    assert "priority_level" in pred
    assert "calibration_method" in pred
    assert "calibration_explanation" in pred

    assert 0.0 <= pred["probability"] <= 1.0
    assert 0.0 <= pred["calibrated_probability"] <= 1.0
    assert 0 <= pred["score"] <= 100
    assert pred["priority"] in ("high", "medium", "low")


@pytest.mark.asyncio
async def test_analyze_customer_api_endpoint_calibration_response():
    """Verify POST /customers/{id}/analyze response includes calibrated probability fields."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        list_res = await client.get("/customers?page=1&page_size=1", headers=headers)
        customer_id = list_res.json()["items"][0]["id"]

        analyze_res = await client.post(f"/customers/{customer_id}/analyze", headers=headers)
        assert analyze_res.status_code == 200
        data = analyze_res.json()

        assert "probability" in data
        assert "raw_probability" in data
        assert "calibrated_probability" in data
        assert "score" in data
        assert "priority" in data
        assert "priority_level" in data
        assert "calibration_method" in data
        assert "calibration_explanation" in data
        assert "factors" in data


@pytest.mark.asyncio
async def test_model_calibration_api_endpoint():
    """Verify GET /model/calibration and /api/v1/model/calibration return calibration report."""
    await seed_database(num_customers=3)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/model/calibration", headers=headers)
        assert res.status_code == 200
        data = res.json()

        assert "calibration_id" in data
        assert "selected_method" in data
        assert "methods_comparison" in data
        assert "score_thresholds" in data

        # Test v1 prefix
        v1_res = await client.get("/api/v1/model/calibration", headers=headers)
        assert v1_res.status_code == 200


@pytest.mark.asyncio
async def test_unauthenticated_calibration_rejection():
    """Verify unauthenticated requests to /model/calibration are rejected with 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/model/calibration")
        assert res.status_code == 401
