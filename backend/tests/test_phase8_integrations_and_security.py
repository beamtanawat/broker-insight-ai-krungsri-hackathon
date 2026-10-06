"""
Comprehensive tests for Phase 8:
Mock Internal System Integrations, Health Checks, Security Verifications, and End-to-End Demo Flow.
"""
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.seed import seed_database
from app.core.security import create_access_token, verify_password
from app.models.user import User
from app.models.customer import Customer
from app.models.broker_decision import BrokerDecision
from app.models.audit_log import AuditLog
from app.integrations.crm_client import crm_client
from app.integrations.kyc_client import kyc_client
from app.integrations.financial_client import financial_client
from app.integrations.insurance_client import insurance_client
from app.integrations.transaction_client import transaction_client
from tests.conftest import TestAsyncSession


async def get_test_token(role: str = "broker") -> str:
    async with TestAsyncSession() as db:
        user = (await db.execute(User.__table__.select().where(User.email == f"{role}@demo.local"))).first()
        user_id = user.id if user else "test-user-id"
    return create_access_token(user_id, role)


@pytest.mark.asyncio
async def test_mock_internal_systems_integrations():
    """Test all 5 mock internal system adapters."""
    # 1. CRM Client
    crm_data = await crm_client.get_customer("KS-00001")
    assert crm_data["external_ref"] == "KS-00001"
    assert "Mock Core CRM" in crm_data["system_source"]
    crm_update = await crm_client.update_contact_history("KS-00001", "Follow-up completed")
    assert crm_update is True

    # 2. KYC Client
    kyc_data = await kyc_client.get_kyc_status("KS-00001")
    assert kyc_data["kyc_status"] == "verified"
    assert kyc_data["aml_sanction_clear"] is True

    # 3. Financial Client
    fin_data = await financial_client.get_financial_summary("KS-00001")
    assert fin_data["total_deposits"] > 0
    assert len(fin_data["active_loans"]) >= 1

    # 4. Insurance Client
    pas_policies = await insurance_client.get_policies_for_customer("KS-00001")
    assert len(pas_policies) >= 1
    assert pas_policies[0]["policy_status"] == "Active"

    # 5. Transaction Client
    tx_data = await transaction_client.get_transaction_activity("KS-00001")
    assert tx_data["window_days"] == 90
    assert tx_data["transaction_count"] > 0


@pytest.mark.asyncio
async def test_health_check_endpoints():
    """Test /health and /api/v1/health return 200 with service and ML model status."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for path in ["/health", "/api/v1/health"]:
            res = await client.get(path)
            assert res.status_code == 200
            data = res.json()
            assert data["status"] == "ok"
            assert data["database"] == "connected"
            assert "ml_model" in data
            assert data["version"] == "1.0.0"


@pytest.mark.asyncio
async def test_security_password_hashing_and_jwt_protection():
    """Test password hashing with bcrypt, no plaintext stored, and JWT authorization."""
    await seed_database(num_customers=5)

    # 1. Verify passwords stored in DB are bcrypt hashes ($2b$)
    async with TestAsyncSession() as db:
        users = (await db.execute(User.__table__.select())).all()
        for u in users:
            assert u.hashed_password.startswith("$2b$")
            assert u.hashed_password != "demo1234"
            assert verify_password("demo1234", u.hashed_password) is True

    # 2. Verify unauthorized request is rejected
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/customers")
        assert res.status_code == 401

        # Tampered Token
        bad_res = await client.get("/customers", headers={"Authorization": "Bearer tampered.fake.token"})
        assert bad_res.status_code == 401


@pytest.mark.asyncio
async def test_security_rbac_and_safe_error_handling():
    """Test RBAC role enforcement and verify error responses don't leak internal traces."""
    await seed_database(num_customers=5)
    broker_token = await get_test_token("broker")
    admin_token = await get_test_token("admin")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Broker cannot access admin user management
        forbidden_res = await client.get("/admin/users", headers={"Authorization": f"Bearer {broker_token}"})
        assert forbidden_res.status_code == 403

        # Admin can access admin user management
        admin_res = await client.get("/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
        assert admin_res.status_code == 200

        # Safe error response for 404
        not_found_res = await client.get("/customers/non-existent-uuid-12345", headers={"Authorization": f"Bearer {broker_token}"})
        assert not_found_res.status_code == 404
        assert "traceback" not in not_found_res.text.lower()


@pytest.mark.asyncio
async def test_full_final_demo_flow():
    """
    Test complete 13-step final demonstration flow:
    1. Login
    2. Dashboard Summary
    3. Priority Customer Selection
    4. Customer Detail
    5. Real ML Priority Scoring (LightGBM)
    6. SHAP Factor Explanations
    7. AI Customer Insight (LLM / Rule fallback)
    8. Need Analysis (5 Categories)
    9. Product Matching & Eligibility
    10. Broker Decision Action (Approve)
    11. AI Conversation Assistant Guide
    12. Follow-up Creation
    13. Audit Log Timeline Verification
    """
    await seed_database(num_customers=10)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Login
        login_res = await client.post(
            "/auth/login",
            json={"email": "broker@demo.local", "password": "demo1234"},
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Dashboard Summary
        dash_res = await client.get("/dashboard/summary", headers=headers)
        assert dash_res.status_code == 200
        dash_data = dash_res.json()
        assert dash_data["total_customers"] > 0

        # 3. Priority Customer Selection
        cust_list_res = await client.get("/customers?page=1&page_size=5", headers=headers)
        assert cust_list_res.status_code == 200
        cust_id = cust_list_res.json()["items"][0]["id"]

        # 4. Customer Detail
        cust_res = await client.get(f"/customers/{cust_id}", headers=headers)
        assert cust_res.status_code == 200
        assert cust_res.json()["id"] == cust_id

        # 5. Real ML Priority Scoring & 6. SHAP Explanation
        analyze_res = await client.post(f"/customers/{cust_id}/analyze", headers=headers)
        assert analyze_res.status_code == 200
        ml_data = analyze_res.json()
        assert 0 <= ml_data["score"] <= 100
        assert ml_data["priority_level"] in ("high", "medium", "low")
        assert len(ml_data["factors"]) > 0
        assert ml_data["model_metadata"]["model_name"] is not None

        # 7. AI Customer Insight
        insight_res = await client.get(f"/customers/{cust_id}/insights", headers=headers)
        assert insight_res.status_code == 200
        ins_data = insight_res.json()
        assert "customer_summary" in ins_data
        assert len(ins_data["key_observations"]) > 0

        # 8. Structured Need Analysis (5 categories)
        needs_res = await client.get(f"/customers/{cust_id}/needs", headers=headers)
        assert needs_res.status_code == 200
        needs_data = needs_res.json()
        assert len(needs_data["needs"]) == 5

        # 9. Product Matching & Eligibility
        recs_res = await client.get(f"/customers/{cust_id}/recommendations", headers=headers)
        assert recs_res.status_code == 200
        recs = recs_res.json()["recommendations"]
        assert len(recs) > 0
        top_rec = recs[0]
        assert top_rec["eligibility_status"] in ("eligible", "partial", "ineligible")

        # 10. Broker Decision Action (Approve)
        dec_res = await client.post(
            f"/customers/{cust_id}/recommendations/{top_rec['recommendation_id']}/decision",
            headers=headers,
            json={
                "action": "approve",
                "feedback": "ยืนยันนำเสนอแผนประกันเพื่อคุ้มครองภาระทางการเงินของครอบครัว",
            },
        )
        assert dec_res.status_code == 200
        assert dec_res.json()["action_taken"] == "approve"

        # 11. AI Conversation Assistant Guide
        convo_res = await client.post(f"/customers/{cust_id}/conversation", headers=headers)
        assert convo_res.status_code == 200
        convo_data = convo_res.json()
        assert len(convo_data["suggested_questions"]) >= 2
        assert len(convo_data["topics_to_explore"]) >= 2

        # 12. Follow-up Creation
        fu_res = await client.post(
            f"/customers/{cust_id}/follow-ups",
            headers=headers,
            json={
                "scheduled_date": "2026-09-10",
                "priority": "high",
                "notes": "นัดพบลูกค้าเพื่อนำเสนอรายละเอียดตามที่ได้รับอนุมัติ",
            },
        )
        assert fu_res.status_code == 201

        # 13. Audit Log Timeline Verification
        audit_res = await client.get(f"/customers/{cust_id}/audit-logs", headers=headers)
        assert audit_res.status_code == 200
        audit_events = audit_res.json()["events"]
        actions = [e["action"] for e in audit_events]
        assert "CUSTOMER_VIEWED" in actions
        assert "AI_ANALYSIS_REQUESTED" in actions
        assert "RECOMMENDATION_DECISION" in actions
        assert "CONVERSATION_ASSISTANT_REQUEST" in actions
        assert "FOLLOW_UP_CREATED" in actions
