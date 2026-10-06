"""
Phase 13 Master E2E Test: Full Customer Journey Integration Validation.
Validates the complete 12-step flow using only real database and backend APIs:
Login -> Dashboard -> Customer Priority -> Detail -> ML Scoring -> TreeSHAP ->
AI Insight -> Need Analysis -> Product Matching -> Broker Decision with Reason ->
Conversation Assistant -> Follow-up Creation -> Audit Log Verification -> Operational Analytics.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select

from app.main import app
from app.core.seed import seed_database
from app.core.security import create_access_token
from app.models.user import User
from app.models.customer import Customer
from tests.conftest import TestAsyncSession


async def get_test_token(role: str = "broker") -> str:
    async with TestAsyncSession() as db:
        if role == "broker":
            cust = (await db.execute(select(Customer).where(Customer.assigned_broker_id.isnot(None)).limit(1))).scalars().first()
            if cust and cust.assigned_broker_id:
                user = (await db.execute(select(User).where(User.id == cust.assigned_broker_id))).scalars().first()
            else:
                user = (await db.execute(select(User).where(User.role == "broker"))).scalars().first()
        else:
            user = (await db.execute(select(User).where(User.role == role))).scalars().first()
        user_id = user.id if user else "test-user-id"
    return create_access_token(user_id, role)


@pytest.mark.asyncio
async def test_full_master_e2e_broker_workflow():
    """Execute complete 12-step broker journey end-to-end against real live endpoints."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Step 1: Health check
        health_res = await client.get("/health")
        assert health_res.status_code == 200
        assert health_res.json()["status"] == "ok"

        # Step 2: Dashboard summary
        dash_res = await client.get("/dashboard/summary", headers=headers)
        assert dash_res.status_code == 200
        assert dash_res.json()["total_customers"] >= 1

        # Step 3: Customer list & priority ranking
        custs_res = await client.get("/customers?page=1&page_size=5", headers=headers)
        assert custs_res.status_code == 200
        customers = custs_res.json()["items"]
        assert len(customers) > 0
        target_cust = customers[0]
        customer_id = target_cust["id"]

        # Step 4: Customer detail & profile
        detail_res = await client.get(f"/customers/{customer_id}", headers=headers)
        assert detail_res.status_code == 200
        assert detail_res.json()["id"] == customer_id

        # Step 5: Trigger real ML Scoring & TreeSHAP factors
        analyze_res = await client.post(f"/customers/{customer_id}/analyze", headers=headers)
        assert analyze_res.status_code == 200
        analyze_data = analyze_res.json()
        assert "score" in analyze_data
        assert "priority_level" in analyze_data
        assert "factors" in analyze_data
        assert len(analyze_data["factors"]) >= 1

        # Step 6: AI Customer Insight (LLM / fallback)
        insight_res = await client.get(f"/customers/{customer_id}/insights", headers=headers)
        assert insight_res.status_code == 200
        insight_data = insight_res.json()
        assert "customer_summary" in insight_data
        assert "key_observations" in insight_data
        assert "cautions" in insight_data

        # Step 7: Structured Need Analysis across 5 categories
        needs_res = await client.get(f"/customers/{customer_id}/needs", headers=headers)
        assert needs_res.status_code == 200
        needs_data = needs_res.json()
        assert len(needs_data["needs"]) == 5

        # Step 8: Product Matching Recommendations
        recs_res = await client.get(f"/customers/{customer_id}/recommendations", headers=headers)
        assert recs_res.status_code == 200
        recs_data = recs_res.json()
        assert len(recs_data["recommendations"]) > 0
        first_rec = recs_data["recommendations"][0]
        rec_id = first_rec["recommendation_id"]
        assert rec_id is not None

        # Step 9: Record Broker Decision with Structured Reason
        decision_payload = {
            "action": "approve",
            "reason": "suitable_coverage",
            "feedback": "Approved following financial portfolio review.",
        }
        dec_res = await client.post(f"/recommendations/{rec_id}/decision", headers=headers, json=decision_payload)
        assert dec_res.status_code == 200
        dec_data = dec_res.json()
        assert dec_data["action_taken"] == "approve"
        assert dec_data["reason"] == "suitable_coverage"

        # Step 10: AI Conversation Assistant
        convo_res = await client.post(f"/customers/{customer_id}/conversation", headers=headers)
        assert convo_res.status_code == 200
        convo_data = convo_res.json()
        assert "conversation_objective" in convo_data
        assert "suggested_opening" in convo_data
        assert "suggested_questions" in convo_data

        # Step 11: Create and retrieve Follow-up
        fu_payload = {
            "scheduled_date": "2026-09-15",
            "priority": "high",
            "notes": "Follow up on proposed mortgage protection policy.",
        }
        fu_res = await client.post(f"/customers/{customer_id}/follow-ups", headers=headers, json=fu_payload)
        assert fu_res.status_code in (200, 201)

        fu_list_res = await client.get(f"/customers/{customer_id}/follow-ups", headers=headers)
        assert fu_list_res.status_code == 200
        assert len(fu_list_res.json()) >= 1

        # Step 12: Verify Audit Log captures complete trace
        audit_res = await client.get(f"/customers/{customer_id}/audit-logs", headers=headers)
        assert audit_res.status_code == 200
        audit_items = audit_res.json()["events"]
        actions = [a["action"] for a in audit_items]
        assert "AI_ANALYSIS_REQUESTED" in actions
        assert "RECOMMENDATION_DECISION" in actions

        # Step 13: Operational Analytics reflects current actions
        analytics_res = await client.get("/analytics/overview", headers=headers)
        assert analytics_res.status_code == 200
        ana_data = analytics_res.json()
        assert ana_data["total_customers"] >= 1
        assert ana_data["ai_analysis_count"] >= 1
