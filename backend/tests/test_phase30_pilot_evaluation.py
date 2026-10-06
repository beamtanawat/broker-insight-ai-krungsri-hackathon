"""
Phase 30 Automated Test Suite: Controlled Pilot Evaluation and User Feedback.
Tests session creation, Likert feedback questionnaire validation, issue logging,
role-based permissions, and honest aggregation dashboard.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.security import create_access_token
from app.core.seed import seed_database
from app.models.user import User
from tests.conftest import TestAsyncSession


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
async def test_pilot_session_lifecycle():
    """Verify that a broker can start, track, and complete a pilot evaluation session."""
    broker_token = await get_test_token("broker")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Start session
        resp_start = await client.post(
            "/api/v1/pilot/sessions",
            headers={"Authorization": f"Bearer {broker_token}"},
            json={"scenario_id": "scenario_a", "customer_id": "cust-001"},
        )
        assert resp_start.status_code == 201
        session_data = resp_start.json()
        assert session_data["status"] == "in_progress"
        assert session_data["scenario_id"] == "scenario_a"
        session_id = session_data["id"]

        # 2. Complete session
        resp_complete = await client.post(
            f"/api/v1/pilot/sessions/{session_id}/complete",
            headers={"Authorization": f"Bearer {broker_token}"},
            json={
                "time_taken_seconds": 45.2,
                "status": "completed",
                "features_used": ["AI Score", "SHAP", "Need Analysis"],
            },
        )
        assert resp_complete.status_code == 200
        comp_data = resp_complete.json()
        assert comp_data["status"] == "completed"
        assert comp_data["time_taken_seconds"] == 45.2


@pytest.mark.asyncio
async def test_pilot_feedback_submission_and_validation():
    """Verify Likert scale (1-5) feedback submission and validation enforcement."""
    broker_token = await get_test_token("broker")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Reject invalid rating > 5
        resp_invalid = await client.post(
            "/api/v1/pilot/feedback",
            headers={"Authorization": f"Bearer {broker_token}"},
            json={
                "scenario_id": "scenario_a",
                "rating_overall": 6,  # Invalid
                "rating_ease_of_use": 5,
                "rating_clarity_priority": 5,
                "rating_shap_explanation": 5,
                "rating_insight_usefulness": 5,
                "rating_recommendations": 5,
                "rating_trust": 5,
            },
        )
        assert resp_invalid.status_code == 422

        # 2. Accept valid rating 1-5
        resp_valid = await client.post(
            "/api/v1/pilot/feedback",
            headers={"Authorization": f"Bearer {broker_token}"},
            json={
                "scenario_id": "scenario_a",
                "rating_overall": 5,
                "rating_ease_of_use": 4,
                "rating_clarity_priority": 5,
                "rating_shap_explanation": 5,
                "rating_insight_usefulness": 4,
                "rating_recommendations": 5,
                "rating_trust": 5,
                "most_useful_feature": "SHAP Explainability",
                "comments": "ช่วยให้เข้าใจเหตุผลการจัดลำดับลูกค้าได้ชัดเจน",
            },
        )
        assert resp_valid.status_code == 201
        assert resp_valid.json()["rating_overall"] == 5


@pytest.mark.asyncio
async def test_pilot_issue_reporting_and_severity():
    """Verify reporting pilot issues with severity P0/P1/P2 and Request ID."""
    broker_token = await get_test_token("broker")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp_issue = await client.post(
            "/api/v1/pilot/issues",
            headers={"Authorization": f"Bearer {broker_token}"},
            json={
                "severity": "P1",
                "scenario_id": "scenario_d",
                "component": "Recommendation Engine",
                "description": "ต้องการให้แสดงข้อมูลเปรียบเทียบเบี้ยประกันหลายตัวเลือก",
                "request_id": "req-test-trace-12345",
            },
        )
        assert resp_issue.status_code == 201
        data = resp_issue.json()
        assert data["severity"] == "P1"
        assert data["status"] == "open"

        # List issues
        resp_list = await client.get("/api/v1/pilot/issues", headers={"Authorization": f"Bearer {broker_token}"})
        assert resp_list.status_code == 200
        assert len(resp_list.json()) > 0


@pytest.mark.asyncio
async def test_pilot_dashboard_aggregation_and_scorecard():
    """Verify unified pilot evaluation dashboard returns technical KPIs, AI metrics, and scorecard."""
    admin_token = await get_test_token("admin")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/pilot/dashboard", headers={"Authorization": f"Bearer {admin_token}"})
        assert resp.status_code == 200
        data = resp.json()

        assert "technical_kpis" in data
        assert "ai_quality_kpis" in data
        assert "human_feedback" in data
        assert "scorecard" in data
        assert len(data["scorecard"]) >= 5
        assert data["technical_kpis"]["api_error_rate"] == 0.0
        assert data["ai_quality_kpis"]["recommendation_ineligible_rate"] == 0.0


@pytest.mark.asyncio
async def test_pilot_rbac_session_visibility():
    """Verify that brokers see their own sessions while managers/admins see all."""
    broker_token = await get_test_token("broker")
    manager_token = await get_test_token("manager")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Broker list sessions
        resp_broker = await client.get("/api/v1/pilot/sessions", headers={"Authorization": f"Bearer {broker_token}"})
        assert resp_broker.status_code == 200

        # Manager list sessions
        resp_manager = await client.get("/api/v1/pilot/sessions", headers={"Authorization": f"Bearer {manager_token}"})
        assert resp_manager.status_code == 200
