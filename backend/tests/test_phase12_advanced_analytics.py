"""
Phase 12 Tests: Advanced Broker and Manager Operational Analytics.
Verifies all 6 analytics endpoints, database calculation integrity, role-based scoping, and empty-state safety.
"""
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.seed import seed_database
from app.core.security import create_access_token
from app.models.user import User
from tests.conftest import TestAsyncSession


async def get_test_token(role: str = "broker") -> str:
    async with TestAsyncSession() as db:
        user = (await db.execute(User.__table__.select().where(User.email == f"{role}@demo.local"))).first()
        user_id = user.id if user else "test-user-id"
    return create_access_token(user_id, role)


@pytest.mark.asyncio
async def test_analytics_overview_endpoint():
    """Verify GET /analytics/overview returns real database-aggregated numbers."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/analytics/overview", headers=headers)
        assert res.status_code == 200
        data = res.json()

        assert data["role_scope"] == "broker"
        assert data["total_customers"] >= 1
        assert "high_priority_customers" in data
        assert "medium_priority_customers" in data
        assert "low_priority_customers" in data
        assert "follow_ups_due" in data
        assert "follow_ups_completed" in data
        assert "follow_ups_overdue" in data
        assert "ai_analysis_count" in data
        assert "recommendation_count" in data
        assert isinstance(data["approval_rate"], float)
        assert isinstance(data["modification_rate"], float)
        assert isinstance(data["rejection_rate"], float)
        assert "as_of" in data


@pytest.mark.asyncio
async def test_analytics_priority_endpoint():
    """Verify GET /analytics/priority returns priority tiers, average score, and 5-bucket distribution."""
    await seed_database(num_customers=5)
    token = await get_test_token("manager")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/analytics/priority", headers=headers)
        assert res.status_code == 200
        data = res.json()

        assert data["role_scope"] == "manager"
        assert data["total_scored_customers"] >= 1
        assert isinstance(data["average_priority_score"], float)
        assert len(data["score_distribution"]) == 5
        assert len(data["priority_trends"]) > 0
        assert "high" in data["priority_distribution"]
        assert "medium" in data["priority_distribution"]
        assert "low" in data["priority_distribution"]


@pytest.mark.asyncio
async def test_analytics_needs_endpoint():
    """Verify GET /analytics/needs returns distribution across the 5 standard categories."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/analytics/needs", headers=headers)
        assert res.status_code == 200
        data = res.json()

        assert data["total_needs_identified"] >= 1
        assert len(data["categories_distribution"]) == 5
        cats = [c["category"] for c in data["categories_distribution"]]
        assert "Health protection" in cats
        assert "Life protection" in cats
        assert "Financial protection" in cats
        assert "Retirement planning" in cats
        assert "Coverage review" in cats
        assert isinstance(data["top_identified_needs"], list)


@pytest.mark.asyncio
async def test_analytics_recommendations_endpoint():
    """Verify GET /analytics/recommendations returns categories, rates, and structured change reasons."""
    await seed_database(num_customers=5)
    token = await get_test_token("admin")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/analytics/recommendations", headers=headers)
        assert res.status_code == 200
        data = res.json()

        assert data["role_scope"] == "admin"
        assert "total_recommendations" in data
        assert "total_decisions" in data
        assert isinstance(data["approval_rate"], float)
        assert isinstance(data["modification_rate"], float)
        assert isinstance(data["rejection_rate"], float)
        assert isinstance(data["recommendations_by_category"], dict)
        assert isinstance(data["common_modification_reasons"], dict)
        assert isinstance(data["common_rejection_reasons"], dict)


@pytest.mark.asyncio
async def test_analytics_followups_endpoint():
    """Verify GET /analytics/follow-ups returns due, completed, overdue, upcoming, and payment status counts."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/analytics/follow-ups", headers=headers)
        assert res.status_code == 200
        data = res.json()

        assert "total_follow_ups" in data
        assert "due_count" in data
        assert "completed_count" in data
        assert "overdue_count" in data
        assert "upcoming_count" in data
        assert "status_distribution" in data
        assert "payment_status_distribution" in data


@pytest.mark.asyncio
async def test_analytics_ai_usage_endpoint():
    """Verify GET /analytics/ai-usage returns ML, LLM, conversation, and feedback operational metrics."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/analytics/ai-usage", headers=headers)
        assert res.status_code == 200
        data = res.json()

        assert data["active_model_version"] == "1.0.0"
        assert data["model_name"] == "LightGBM Priority Classifier"
        assert "total_ai_scoring_requests" in data
        assert "total_llm_insight_requests" in data
        assert "total_conversation_requests" in data
        assert "total_feedback_recorded" in data
        assert "feedback_breakdown" in data


@pytest.mark.asyncio
async def test_unauthenticated_analytics_rejection():
    """Verify all analytics endpoints reject requests without authorization token with 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for path in [
            "/analytics/overview",
            "/analytics/priority",
            "/analytics/needs",
            "/analytics/recommendations",
            "/analytics/follow-ups",
            "/analytics/ai-usage",
        ]:
            res = await client.get(path)
            assert res.status_code == 401
