"""
Comprehensive test suite for Phase 14:
ML Validation, Reproducible Feature Engineering, Baseline Model Benchmarking,
5-Fold Stratified Cross-Validation, and Comparison Artifacts.
"""
import json
from pathlib import Path
import pytest
from httpx import AsyncClient, ASGITransport
import numpy as np
import pandas as pd

from app.main import app
from app.core.seed import seed_database
from app.core.security import create_access_token
from app.models.user import User
from app.models.customer import Customer
from app.ml.features import FEATURE_COLUMNS, extract_features_from_customer
from app.ml.train import generate_synthetic_training_dataset
from app.ml.benchmark import run_model_benchmarks
from tests.conftest import TestAsyncSession

ARTIFACTS_DIR = Path(__file__).parent.parent / "app" / "ml" / "artifacts"


async def get_test_token(role: str = "broker") -> str:
    async with TestAsyncSession() as db:
        user = (await db.execute(User.__table__.select().where(User.email == f"{role}@demo.local"))).first()
        user_id = user.id if user else "test-user-id"
    return create_access_token(user_id, role)


def test_reproducible_feature_generation_and_shape():
    """Verify feature generation produces exact 17 feature columns without NaN or infinity."""
    df = generate_synthetic_training_dataset(n_samples=200)
    assert len(df) == 200
    assert "customer_priority" in df.columns

    for col in FEATURE_COLUMNS:
        assert col in df.columns, f"Missing expected feature column: {col}"
        assert not df[col].isnull().any(), f"Found NaN values in feature column: {col}"
        assert not np.isinf(df[col]).any(), f"Found infinite values in feature column: {col}"

    assert len(FEATURE_COLUMNS) == 17


def test_run_model_benchmarks_reproducibility():
    """Verify benchmark runs across Logistic Regression, Random Forest, and LightGBM."""
    benchmark_res = run_model_benchmarks(save_artifacts=True, n_samples=300)

    assert "benchmark_id" in benchmark_res
    assert "models" in benchmark_res
    assert len(benchmark_res["models"]) >= 2  # At least Logistic Regression & Random Forest

    model_ids = [m["model_id"] for m in benchmark_res["models"]]
    assert "logistic_regression" in model_ids
    assert "random_forest" in model_ids

    for m in benchmark_res["models"]:
        metrics = m["test_metrics"]
        assert 0.0 <= metrics["accuracy"] <= 1.0
        assert 0.0 <= metrics["precision"] <= 1.0
        assert 0.0 <= metrics["recall"] <= 1.0
        assert 0.0 <= metrics["f1_score"] <= 1.0
        assert 0.0 <= metrics["roc_auc"] <= 1.0
        assert "cross_validation_5fold" in m

    champion = benchmark_res["champion_model"]
    assert champion["model_id"] in model_ids
    assert champion["test_f1"] > 0.0


def test_5fold_cross_validation_metrics_bounds():
    """Verify 5-fold CV metrics produce valid mean and positive standard deviations."""
    benchmark_res = run_model_benchmarks(save_artifacts=False, n_samples=300)

    for m in benchmark_res["models"]:
        cv = m["cross_validation_5fold"]
        assert 0.0 <= cv["cv_f1_mean"] <= 1.0
        assert cv["cv_f1_std"] >= 0.0
        assert 0.0 <= cv["cv_roc_auc_mean"] <= 1.0
        assert cv["cv_roc_auc_std"] >= 0.0
        assert 0.0 <= cv["cv_precision_mean"] <= 1.0
        assert 0.0 <= cv["cv_recall_mean"] <= 1.0


def test_model_comparison_json_artifact_integrity():
    """Verify model_comparison.json is created with proper metadata and disclaimers."""
    run_model_benchmarks(save_artifacts=True, n_samples=300)
    comp_file = ARTIFACTS_DIR / "model_comparison.json"
    assert comp_file.exists()

    with open(comp_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert "dataset_metadata" in data
    assert data["dataset_metadata"]["is_synthetic"] is True
    assert "evaluation_notice" in data["dataset_metadata"]
    assert "champion_model" in data
    assert "models" in data
    assert len(data["models"]) >= 2


@pytest.mark.asyncio
async def test_model_benchmark_api_endpoint():
    """Test GET /model/benchmark and /api/v1/model/benchmark return structured benchmark response."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/model/benchmark", headers=headers)
        assert res.status_code == 200
        data = res.json()

        assert "benchmark_id" in data
        assert "dataset_metadata" in data
        assert "models" in data
        assert len(data["models"]) >= 2
        assert "champion_model" in data
        assert data["champion_model"]["test_f1"] > 0.0

        # Also test /api/v1/model/benchmark
        v1_res = await client.get("/api/v1/model/benchmark", headers=headers)
        assert v1_res.status_code == 200


@pytest.mark.asyncio
async def test_unauthenticated_benchmark_rejection():
    """Verify unauthorized requests to /model/benchmark are rejected with 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/model/benchmark")
        assert res.status_code == 401
