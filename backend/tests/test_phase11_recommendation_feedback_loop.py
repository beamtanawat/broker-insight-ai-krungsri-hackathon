"""
Phase 11 Tests: Product Recommendation Feedback Loop, Broker Decisions, Structured Reasons, and Analytics.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select

from app.main import app
from app.core.seed import seed_database
from app.core.security import create_access_token
from app.models.user import User
from app.models.customer import Customer
from app.models.recommendation import Recommendation
from app.models.broker_decision import BrokerDecision
from app.models.audit_log import AuditLog
from tests.conftest import TestAsyncSession


async def get_test_token(role: str = "broker") -> str:
    async with TestAsyncSession() as db:
        user = (await db.execute(User.__table__.select().where(User.email == f"{role}@demo.local"))).first()
        user_id = user.id if user else "test-user-id"
    return create_access_token(user_id, role)


@pytest.mark.asyncio
async def test_broker_decision_approve_with_reason():
    """Test approving a recommendation with structured reason and status update."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Get a customer and generate recommendations
        list_res = await client.get("/customers?page=1&page_size=1", headers=headers)
        customer_id = list_res.json()["items"][0]["id"]

        recs_res = await client.get(f"/customers/{customer_id}/recommendations", headers=headers)
        assert recs_res.status_code == 200
        recs_data = recs_res.json()
        assert len(recs_data["recommendations"]) > 0

        rec_item = recs_data["recommendations"][0]
        rec_id = rec_item["recommendation_id"]
        assert rec_id is not None

        # 2. Record Approve Decision with structured reason
        dec_payload = {
            "action": "approve",
            "reason": "suitable_coverage",
            "feedback": "Customer has high mortgage debt; loan protection is critical.",
        }
        dec_res = await client.post(f"/recommendations/{rec_id}/decision", headers=headers, json=dec_payload)
        assert dec_res.status_code == 200
        dec_data = dec_res.json()
        assert dec_data["action_taken"] == "approve"
        assert dec_data["reason"] == "suitable_coverage"
        assert dec_data["customer_id"] == customer_id

    # 3. Verify DB update
    async with TestAsyncSession() as db:
        rec_db = (await db.execute(select(Recommendation).where(Recommendation.id == rec_id))).scalar_one()
        assert rec_db.status == "accepted"


@pytest.mark.asyncio
async def test_broker_decision_modify_with_reason():
    """Test modifying a recommendation with structured reason and notes."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Get customer and recommendations
        list_res = await client.get("/customers?page=1&page_size=1", headers=headers)
        customer_id = list_res.json()["items"][0]["id"]
        recs_res = await client.get(f"/customers/{customer_id}/recommendations", headers=headers)
        rec_id = recs_res.json()["recommendations"][0]["recommendation_id"]

        # Record Modify Decision
        dec_payload = {
            "action": "modify",
            "reason": "customer_context_changed",
            "feedback": "Customer requested lower monthly premium with deductible.",
        }
        dec_res = await client.post(f"/recommendations/{rec_id}/decision", headers=headers, json=dec_payload)
        assert dec_res.status_code == 200
        dec_data = dec_res.json()
        assert dec_data["action_taken"] == "modify"
        assert dec_data["reason"] == "customer_context_changed"

    # Verify DB status
    async with TestAsyncSession() as db:
        rec_db = (await db.execute(select(Recommendation).where(Recommendation.id == rec_id))).scalar_one()
        assert rec_db.status == "modified"


@pytest.mark.asyncio
async def test_broker_decision_reject_with_reason():
    """Test rejecting a recommendation with structured reason."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        list_res = await client.get("/customers?page=1&page_size=1", headers=headers)
        customer_id = list_res.json()["items"][0]["id"]
        recs_res = await client.get(f"/customers/{customer_id}/recommendations", headers=headers)
        rec_id = recs_res.json()["recommendations"][0]["recommendation_id"]

        # Record Reject Decision
        dec_payload = {
            "action": "reject",
            "reason": "not_relevant",
            "feedback": "Customer already has sufficient health rider coverage.",
        }
        dec_res = await client.post(f"/recommendations/{rec_id}/decision", headers=headers, json=dec_payload)
        assert dec_res.status_code == 200
        dec_data = dec_res.json()
        assert dec_data["action_taken"] == "reject"
        assert dec_data["reason"] == "not_relevant"

    # Verify DB status
    async with TestAsyncSession() as db:
        rec_db = (await db.execute(select(Recommendation).where(Recommendation.id == rec_id))).scalar_one()
        assert rec_db.status == "declined"


@pytest.mark.asyncio
async def test_invalid_decision_action_rejection():
    """Verify submitting an invalid action returns HTTP 422 Unprocessable Entity."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        list_res = await client.get("/customers?page=1&page_size=1", headers=headers)
        customer_id = list_res.json()["items"][0]["id"]
        recs_res = await client.get(f"/customers/{customer_id}/recommendations", headers=headers)
        rec_id = recs_res.json()["recommendations"][0]["recommendation_id"]

        bad_payload = {"action": "unsupported_invalid_action"}
        res = await client.post(f"/recommendations/{rec_id}/decision", headers=headers, json=bad_payload)
        assert res.status_code == 422


@pytest.mark.asyncio
async def test_unauthorized_decision_rejection():
    """Verify unauthorized decision submission returns HTTP 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/recommendations/test-rec-id/decision", json={"action": "approve"})
        assert res.status_code == 401


@pytest.mark.asyncio
async def test_recommendation_analytics_endpoint():
    """Verify GET /recommendations/analytics returns accurate aggregated metrics from DB."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Generate recommendations and record a decision
        list_res = await client.get("/customers?page=1&page_size=1", headers=headers)
        customer_id = list_res.json()["items"][0]["id"]
        recs_res = await client.get(f"/customers/{customer_id}/recommendations", headers=headers)
        rec_id = recs_res.json()["recommendations"][0]["recommendation_id"]

        await client.post(
            f"/recommendations/{rec_id}/decision",
            headers=headers,
            json={"action": "approve", "reason": "suitable_coverage"},
        )

        # Call analytics endpoint
        ana_res = await client.get("/recommendations/analytics", headers=headers)
        assert ana_res.status_code == 200
        data = ana_res.json()

        assert data["total_recommendations"] >= 1
        assert data["total_decisions"] >= 1
        assert data["approval_count"] >= 1
        assert isinstance(data["approval_rate"], float)
        assert isinstance(data["modification_rate"], float)
        assert isinstance(data["rejection_rate"], float)
        assert isinstance(data["recommendations_by_category"], dict)
        assert "suitable_coverage" in data["common_approval_reasons"]


@pytest.mark.asyncio
async def test_database_persistence_and_audit_logging():
    """Verify decisions create BrokerDecision rows and log RECOMMENDATION_DECISION audit events."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        list_res = await client.get("/customers?page=1&page_size=1", headers=headers)
        customer_id = list_res.json()["items"][0]["id"]
        recs_res = await client.get(f"/customers/{customer_id}/recommendations", headers=headers)
        rec_id = recs_res.json()["recommendations"][0]["recommendation_id"]

        await client.post(
            f"/recommendations/{rec_id}/decision",
            headers=headers,
            json={"action": "modify", "reason": "existing_coverage", "feedback": "Has another policy with AIA."},
        )

    # Check database persistence
    async with TestAsyncSession() as db:
        dec = (await db.execute(select(BrokerDecision).where(BrokerDecision.recommendation_id == rec_id).order_by(BrokerDecision.decision_date.desc()))).scalars().first()
        assert dec is not None
        assert dec.action_taken == "modify"
        assert dec.reason == "existing_coverage"
        assert dec.product_id is not None

        # Check Audit Log
        audit = (await db.execute(select(AuditLog).where(AuditLog.entity_id == rec_id).order_by(AuditLog.timestamp.desc()))).scalars().first()
        assert audit is not None
        assert audit.action == "RECOMMENDATION_DECISION"
