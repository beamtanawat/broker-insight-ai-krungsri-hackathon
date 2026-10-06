"""Comprehensive tests for Phase 4: Real ML Priority Scoring, Evaluation, and TreeSHAP."""
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.seed import seed_database
from app.core.security import create_access_token
from app.models.user import User
from app.models.customer import Customer
from app.models.ai_score import AIScore
from app.ml.features import extract_features_from_customer, FEATURE_COLUMNS, FEATURE_THAI_LABELS
from app.ml.train import train_pipeline
from app.ml.predict import predictor
from tests.conftest import TestAsyncSession


async def get_test_token(role: str = "broker") -> str:
    async with TestAsyncSession() as db:
        user = (await db.execute(User.__table__.select().where(User.email == f"{role}@demo.local"))).first()
        user_id = user.id if user else "test-user-id"
    return create_access_token(user_id, role)


@pytest.mark.asyncio
async def test_feature_generation():
    """Test feature extraction produces all 17 canonical features with correct data types."""
    await seed_database(num_customers=5)
    async with TestAsyncSession() as db:
        cust = (await db.execute(Customer.__table__.select().limit(1))).first()

    features = extract_features_from_customer(cust)
    assert isinstance(features, dict)
    for col in FEATURE_COLUMNS:
        assert col in features, f"Missing feature column: {col}"
        assert col in FEATURE_THAI_LABELS, f"Missing Thai label for feature: {col}"

    assert isinstance(features["age"], int)
    assert isinstance(features["income_band_numeric"], float)
    assert isinstance(features["total_assets"], float)
    assert features["relationship_tier_encoded"] in (0, 1, 2)


@pytest.mark.asyncio
async def test_model_training_and_evaluation_metrics():
    """Test training pipeline calculates genuine classification metrics and saves artifacts."""
    result = train_pipeline(save_artifacts=True)
    metrics = result["metrics"]

    assert "accuracy" in metrics
    assert "precision" in metrics
    assert "recall" in metrics
    assert "f1_score" in metrics
    assert "roc_auc" in metrics
    assert "confusion_matrix" in metrics

    # Verify calculated metric boundaries
    assert 0.0 <= metrics["accuracy"] <= 1.0
    assert 0.0 <= metrics["precision"] <= 1.0
    assert 0.0 <= metrics["recall"] <= 1.0
    assert 0.0 <= metrics["f1_score"] <= 1.0
    assert metrics["roc_auc"] >= 0.75, "Expected strong discriminatory power from synthetic features"
    assert "matrix_raw" in metrics["confusion_matrix"]


@pytest.mark.asyncio
async def test_prediction_and_shap_factors():
    """Test predictor returns score 0-100, priority level, and valid TreeSHAP contributing factors."""
    await seed_database(num_customers=5)
    async with TestAsyncSession() as db:
        cust = (await db.execute(Customer.__table__.select().limit(1))).first()

    output = predictor.predict_customer(cust)
    assert "score" in output
    assert 0 <= output["score"] <= 100
    assert output["priority_level"] in ("high", "medium", "low")
    assert "model_name" in output
    assert "model_version" in output
    assert "factors" in output

    factors = output["factors"]
    assert len(factors) >= 1
    top_factor = factors[0]
    assert "feature" in top_factor
    assert "label" in top_factor
    assert "importance" in top_factor
    assert "shap_value" in top_factor
    assert top_factor["impact"] in ("positive", "negative")


@pytest.mark.asyncio
async def test_analyze_api_endpoint():
    """Test POST /customers/{id}/analyze runs ML inference, returns SHAP factors, and saves to DB."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Get customer ID
        list_res = await client.get("/customers?page=1&page_size=1", headers=headers)
        customer_id = list_res.json()["items"][0]["id"]

        # Run analysis
        analyze_res = await client.post(f"/customers/{customer_id}/analyze", headers=headers)
        assert analyze_res.status_code == 200
        data = analyze_res.json()

        assert data["customer_id"] == customer_id
        assert "score" in data
        assert 0 <= data["score"] <= 100
        assert data["priority_level"] in ("high", "medium", "low")
        assert "factors" in data
        assert len(data["factors"]) > 0
        assert "model_metadata" in data
        assert "LightGBM" in data["model_metadata"]["model_name"] or "RandomForest" in data["model_metadata"]["model_name"]
        assert "features_used" in data

    # Verify score persisted in database
    async with TestAsyncSession() as db:
        score_count = (await db.execute(AIScore.__table__.select().where(AIScore.customer_id == customer_id))).all()
        assert len(score_count) >= 1


@pytest.mark.asyncio
async def test_analyze_non_existent_customer():
    """Test POST /customers/{id}/analyze returns 404 for invalid customer ID."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/customers/non-existent-uuid/analyze", headers=headers)
        assert res.status_code == 404
        assert "not found" in res.json()["detail"].lower()
