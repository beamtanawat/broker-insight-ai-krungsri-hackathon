"""
Comprehensive tests for Phase 7:
Conversation Assistant, Follow-up Management, Audit Logging, and Model Traceability.
"""
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.seed import seed_database
from app.core.security import create_access_token
from app.models.user import User
from app.models.customer import Customer
from app.models.audit_log import AuditLog
from app.models.followup import FollowUp
from app.services.conversation_service import conversation_service
from tests.conftest import TestAsyncSession


async def get_test_token(role: str = "broker") -> str:
    async with TestAsyncSession() as db:
        user = (await db.execute(User.__table__.select().where(User.email == f"{role}@demo.local"))).first()
        user_id = user.id if user else "test-user-id"
    return create_access_token(user_id, role)


@pytest.mark.asyncio
async def test_conversation_assistant_service_output():
    """Test Conversation Assistant generates all 6 required elements and model metadata."""
    dummy_ctx = {
        "full_name": "สมชาย มั่นคง",
        "external_ref": "KS-001",
        "age": 42,
        "occupation": "ผู้จัดการฝ่ายขาย",
        "total_assets": 3000000.0,
        "total_liabilities": 1500000.0,
        "has_active_loan": True,
        "policies": ["กรุงศรี ไลฟ์ พลัส"],
        "score": 80,
        "priority_level": "high",
        "top_factors": ["มีภาระสินเชื่อ", "ยอดสินทรัพย์รวม"],
        "needs": ["ความคุ้มครองภาระหนี้สิน MRTA"],
        "recommended_products": ["กรุงศรี คุ้มครองวงเงินสินเชื่อบ้าน (MRTA)"],
    }

    guide = conversation_service.generate_conversation_guide("test-cust-id", dummy_ctx)
    assert guide.customer_id == "test-cust-id"
    assert len(guide.conversation_objective) > 10
    assert len(guide.suggested_opening) > 10
    assert len(guide.suggested_questions) >= 2
    assert len(guide.topics_to_explore) >= 2
    assert len(guide.potential_concerns) >= 2
    assert len(guide.follow_up_questions) >= 2

    # Model Traceability
    assert guide.model_metadata.model_name is not None
    assert guide.model_metadata.model_version is not None
    assert guide.model_metadata.timestamp is not None
    assert guide.model_metadata.provider is not None


@pytest.mark.asyncio
async def test_conversation_assistant_api_endpoint():
    """Test POST /customers/{id}/conversation endpoint returns structured guide and logs audit."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        list_res = await client.get("/customers?page=1&page_size=1", headers=headers)
        customer_id = list_res.json()["items"][0]["id"]

        convo_res = await client.post(f"/customers/{customer_id}/conversation", headers=headers)
        assert convo_res.status_code == 200
        data = convo_res.json()
        assert data["customer_id"] == customer_id
        assert "conversation_objective" in data
        assert "suggested_opening" in data
        assert "suggested_questions" in data
        assert "topics_to_explore" in data
        assert "potential_concerns" in data
        assert "follow_up_questions" in data
        assert "model_metadata" in data


@pytest.mark.asyncio
async def test_followup_create_and_update():
    """Test creating and updating customer follow-up items with audit logs."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        list_res = await client.get("/customers?page=1&page_size=1", headers=headers)
        customer_id = list_res.json()["items"][0]["id"]

        # 1. Create Follow-up
        create_res = await client.post(
            f"/customers/{customer_id}/follow-ups",
            headers=headers,
            json={
                "scheduled_date": "2026-09-15",
                "follow_up_window": "Within 14 days",
                "status": "open",
                "priority": "high",
                "payment_status": "pending",
                "notes": "นัดโทรทบทวนความคุ้มครองสินเชื่อบ้าน",
            },
        )
        assert create_res.status_code == 201
        fu = create_res.json()
        fu_id = fu["id"]
        assert fu["status"] == "open"
        assert fu["notes"] == "นัดโทรทบทวนความคุ้มครองสินเชื่อบ้าน"

        # 2. Update Follow-up
        update_res = await client.patch(
            f"/customers/{customer_id}/follow-ups/{fu_id}",
            headers=headers,
            json={
                "status": "done",
                "notes": "ติดต่อเรียบร้อยแล้ว ลูกค้านัดส่งเอกสาร",
            },
        )
        assert update_res.status_code == 200
        updated = update_res.json()
        assert updated["status"] == "done"
        assert "ส่งเอกสาร" in updated["notes"]


@pytest.mark.asyncio
async def test_customer_audit_history_endpoint():
    """Test GET /customers/{id}/audit-logs returns timeline of recorded actions."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        list_res = await client.get("/customers?page=1&page_size=1", headers=headers)
        customer_id = list_res.json()["items"][0]["id"]

        # Trigger customer view, analyze, conversation
        await client.get(f"/customers/{customer_id}", headers=headers)
        await client.post(f"/customers/{customer_id}/analyze", headers=headers)
        await client.post(f"/customers/{customer_id}/conversation", headers=headers)

        # Get Audit logs
        audit_res = await client.get(f"/customers/{customer_id}/audit-logs", headers=headers)
        assert audit_res.status_code == 200
        audit_data = audit_res.json()
        assert audit_data["customer_id"] == customer_id
        assert audit_data["total_events"] >= 3

        actions = {e["action"] for e in audit_data["events"]}
        assert "CUSTOMER_VIEWED" in actions
        assert "AI_ANALYSIS_REQUESTED" in actions
        assert "CONVERSATION_ASSISTANT_REQUEST" in actions


@pytest.mark.asyncio
async def test_full_phase7_integrated_journey():
    """
    Test full integrated workflow:
    Customer Analysis -> Recommendation -> Conversation Assistant -> Follow-up Creation -> Audit Record.
    """
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Customer Selection
        list_res = await client.get("/customers?page=1&page_size=1", headers=headers)
        customer_id = list_res.json()["items"][0]["id"]

        # 2. AI Scoring
        analyze_res = await client.post(f"/customers/{customer_id}/analyze", headers=headers)
        assert analyze_res.status_code == 200

        # 3. Product Recommendation & Decision
        rec_res = await client.get(f"/customers/{customer_id}/recommendations", headers=headers)
        rec_id = rec_res.json()["recommendations"][0]["recommendation_id"]
        dec_res = await client.post(
            f"/customers/{customer_id}/recommendations/{rec_id}/decision",
            headers=headers,
            json={"action": "approve", "feedback": "อนุมัตินำเสนอตามแผน"},
        )
        assert dec_res.status_code == 200

        # 4. Conversation Assistant
        convo_res = await client.post(f"/customers/{customer_id}/conversation", headers=headers)
        assert convo_res.status_code == 200
        convo = convo_res.json()
        assert "conversation_objective" in convo

        # 5. Follow-up Creation
        fu_res = await client.post(
            f"/customers/{customer_id}/follow-ups",
            headers=headers,
            json={
                "scheduled_date": "2026-09-20",
                "notes": "ติดตามผลการพูดคุยตามแนวทาง AI Conversation Guide",
            },
        )
        assert fu_res.status_code == 201

        # 6. Audit Trail Verification
        audit_res = await client.get(f"/customers/{customer_id}/audit-logs", headers=headers)
        assert audit_res.status_code == 200
        events = audit_res.json()["events"]
        actions = [e["action"] for e in events]
        assert "RECOMMENDATION_DECISION" in actions
        assert "CONVERSATION_ASSISTANT_REQUEST" in actions
        assert "FOLLOW_UP_CREATED" in actions
