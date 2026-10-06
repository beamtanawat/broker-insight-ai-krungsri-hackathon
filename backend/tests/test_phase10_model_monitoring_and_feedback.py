"""
Phase 10 Tests: AI Model Monitoring, Evaluation Metrics, Model Versioning, and Broker Feedback System.
"""
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.seed import seed_database
from app.core.security import create_access_token
from app.models.user import User
from app.models.customer import Customer
from app.models.audit_log import AuditLog
from tests.conftest import TestAsyncSession


async def get_test_token(role: str = "broker") -> str:
    async with TestAsyncSession() as db:
        user = (await db.execute(User.__table__.select().where(User.email == f"{role}@demo.local"))).first()
        user_id = user.id if user else "test-user-id"
    return create_access_token(user_id, role)


@pytest.mark.asyncio
async def test_get_model_metrics_synthetic_label():
    """Verify GET /model/metrics returns actual ML pipeline metrics and synthetic disclaimer."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/model/metrics", headers=headers)
        assert res.status_code == 200
        data = res.json()

        assert data["model_name"] == "LightGBM Priority Classifier"
        assert data["model_version"] == "1.0.0"
        assert data["dataset_label"] == "Synthetic Demo Dataset Evaluation"
        assert "disclaimer" in data

        metrics = data["metrics"]
        assert metrics["accuracy"] >= 0.80
        assert metrics["precision"] >= 0.75
        assert metrics["recall"] >= 0.70
        assert metrics["f1_score"] >= 0.80
        assert metrics["roc_auc"] >= 0.90
        assert len(data["features_used"]) > 5


@pytest.mark.asyncio
async def test_get_model_versions_catalog():
    """Verify GET /model/versions returns version catalog with active version."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/model/versions", headers=headers)
        assert res.status_code == 200
        data = res.json()

        assert data["active_version"] == "1.0.0"
        assert len(data["versions"]) >= 1
        active_entry = next((v for v in data["versions"] if v["version"] == "1.0.0"), None)
        assert active_entry is not None
        assert active_entry["status"] == "active"


@pytest.mark.asyncio
async def test_get_model_monitoring_statistics():
    """Verify GET /model/monitoring aggregates operational statistics and score distribution."""
    await seed_database(num_customers=10)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/model/monitoring", headers=headers)
        assert res.status_code == 200
        data = res.json()

        assert data["model_name"] == "LightGBM Priority Classifier"
        assert data["total_predictions"] >= 10
        assert "high" in data["predictions_by_priority"]
        assert "medium" in data["predictions_by_priority"]
        assert "low" in data["predictions_by_priority"]
        assert "useful" in data["feedback_summary"]
        assert isinstance(data["broker_acceptance_rate"], float)
        assert isinstance(data["broker_override_rate"], float)
        assert len(data["score_distribution"]) == 5


@pytest.mark.asyncio
async def test_broker_feedback_submission_and_audit():
    """Test POST /model/feedback records broker rating, reason, and triggers audit log."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Get a customer ID
        list_res = await client.get("/customers?page=1&page_size=1", headers=headers)
        customer_id = list_res.json()["items"][0]["id"]

        # Submit feedback
        fb_payload = {
            "customer_id": customer_id,
            "feedback_type": "useful",
            "reason": "accurate_priority",
            "comments": "SHAP factors align with customer's recent loan expansion.",
        }
        fb_res = await client.post("/model/feedback", headers=headers, json=fb_payload)
        assert fb_res.status_code == 201
        fb_data = fb_res.json()
        assert fb_data["feedback_type"] == "useful"
        assert fb_data["reason"] == "accurate_priority"
        assert fb_data["customer_id"] == customer_id

    # Verify audit log was recorded
    async with TestAsyncSession() as db:
        logs = (await db.execute(AuditLog.__table__.select().where(AuditLog.action == "MODEL_FEEDBACK_SUBMITTED"))).all()
        assert len(logs) >= 1


@pytest.mark.asyncio
async def test_list_model_feedback():
    """Test GET /model/feedback retrieves recorded feedback items."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/model/feedback?page=1&page_size=10", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert "items" in data
        assert "total" in data


@pytest.mark.asyncio
async def test_model_monitoring_unauthenticated_rejection():
    """Verify unauthorized requests to model monitoring endpoints return 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/model/metrics")
        assert res.status_code == 401
