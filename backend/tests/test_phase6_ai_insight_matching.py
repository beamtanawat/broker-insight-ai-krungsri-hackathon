"""
Comprehensive tests for Phase 6:
LLM Customer Insight, Need Analysis (5 categories), Product Matching, and Broker Decisions.
"""
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.seed import seed_database
from app.core.security import create_access_token
from app.models.user import User
from app.models.customer import Customer
from app.models.recommendation import Recommendation
from app.models.broker_decision import BrokerDecision
from app.services.llm_service import llm_service
from app.services.need_service import need_service
from tests.conftest import TestAsyncSession


async def get_test_token(role: str = "broker") -> str:
    async with TestAsyncSession() as db:
        user = (await db.execute(User.__table__.select().where(User.email == f"{role}@demo.local"))).first()
        user_id = user.id if user else "test-user-id"
    return create_access_token(user_id, role)


@pytest.mark.asyncio
async def test_llm_insight_generation_and_deterministic_fallback():
    """Test LLM service generates structured summary, observations, needs, topics, and cautions."""
    dummy_data = {
        "id": "test-id-123",
        "external_ref": "KS-TEST",
        "full_name": "ทดสอบ สรุปข้อมูล",
        "age": 45,
        "occupation": "เจ้าของกิจการ",
        "income_range": "100,001 - 200,000 บาท/เดือน",
        "relationship_tier": "Platinum",
        "kyc_status": "verified",
        "total_assets": 5000000.0,
        "total_liabilities": 2000000.0,
        "has_active_loan": True,
        "loan_details": "สินเชื่อบ้าน",
        "monthly_savings": 40000.0,
        "policies": ["กรุงศรี ไลฟ์ พลัส (Life)"],
        "score": 85,
        "priority_level": "high",
        "top_factors": ["มีภาระสินเชื่อ", "ยอดเงินออมสูง"],
        "detected_needs": ["ทบทวนความคุ้มครองหนี้"],
    }

    result = llm_service.generate_insight(dummy_data)
    assert "customer_summary" in result
    assert len(result["customer_summary"]) > 10
    assert "key_observations" in result
    assert len(result["key_observations"]) >= 1
    assert "potential_needs" in result
    assert len(result["potential_needs"]) >= 1
    assert "conversation_topics" in result
    assert len(result["conversation_topics"]) >= 1
    assert "cautions" in result
    assert len(result["cautions"]) >= 1
    assert "provider" in result


@pytest.mark.asyncio
async def test_need_analysis_5_categories():
    """Test structured Need Analysis evaluates all 5 canonical categories."""
    await seed_database(num_customers=5)
    async with TestAsyncSession() as db:
        cust = (await db.execute(Customer.__table__.select().limit(1))).first()

    analysis = need_service.analyze_customer_needs(cust)
    assert analysis.customer_id == cust.id
    assert len(analysis.needs) == 5

    categories = {n.category for n in analysis.needs}
    expected_categories = {
        "Health protection",
        "Life protection",
        "Financial protection",
        "Retirement planning",
        "Coverage review",
    }
    assert categories == expected_categories

    for n in analysis.needs:
        assert 0.0 <= n.score <= 1.0
        assert n.severity in ("high", "medium", "low", "none")
        assert len(n.supporting_signals) >= 1
        assert "Potential" in n.explanation or "warrant" in n.explanation or "Consider" in n.explanation


@pytest.mark.asyncio
async def test_ai_insights_api_endpoint():
    """Test GET /customers/{id}/insights returns structured insight response."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        list_res = await client.get("/customers?page=1&page_size=1", headers=headers)
        customer_id = list_res.json()["items"][0]["id"]

        res = await client.get(f"/customers/{customer_id}/insights", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["customer_id"] == customer_id
        assert "customer_summary" in data
        assert "key_observations" in data
        assert "potential_needs" in data
        assert "conversation_topics" in data
        assert "cautions" in data
        assert "provider" in data


@pytest.mark.asyncio
async def test_needs_and_recommendations_api_endpoints():
    """Test GET /customers/{id}/needs and GET /customers/{id}/recommendations."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        list_res = await client.get("/customers?page=1&page_size=1", headers=headers)
        customer_id = list_res.json()["items"][0]["id"]

        # 1. Needs
        needs_res = await client.get(f"/customers/{customer_id}/needs", headers=headers)
        assert needs_res.status_code == 200
        needs_data = needs_res.json()
        assert len(needs_data["needs"]) == 5

        # 2. Recommendations
        rec_res = await client.get(f"/customers/{customer_id}/recommendations", headers=headers)
        assert rec_res.status_code == 200
        rec_data = rec_res.json()
        assert "recommendations" in rec_data
        assert len(rec_data["recommendations"]) > 0

        first_rec = rec_data["recommendations"][0]
        assert "product_id" in first_rec
        assert "product_name" in first_rec
        assert 0 <= first_rec["match_score"] <= 100
        assert first_rec["eligibility_status"] in ("eligible", "partial", "ineligible")
        assert len(first_rec["reasons"]) >= 1


@pytest.mark.asyncio
async def test_broker_decision_persistence():
    """Test POST /customers/{id}/recommendations/{rec_id}/decision records broker action in database."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        list_res = await client.get("/customers?page=1&page_size=1", headers=headers)
        customer_id = list_res.json()["items"][0]["id"]

        # Get recommendations
        rec_res = await client.get(f"/customers/{customer_id}/recommendations", headers=headers)
        rec_id = rec_res.json()["recommendations"][0]["recommendation_id"]
        assert rec_id is not None

        # Post Broker Decision: Approve
        decision_res = await client.post(
            f"/customers/{customer_id}/recommendations/{rec_id}/decision",
            headers=headers,
            json={
                "action": "approve",
                "feedback": "ลูกค้าตกลงเข้ารับฟังรายละเอียดแผนบำนาญลดหย่อนภาษี",
            },
        )
        assert decision_res.status_code == 200
        dec_data = decision_res.json()
        assert dec_data["action_taken"] == "approve"
        assert dec_data["customer_id"] == customer_id

    # Verify decision persisted in DB
    async with TestAsyncSession() as db:
        stored = (await db.execute(BrokerDecision.__table__.select().where(BrokerDecision.id == dec_data["id"]))).first()
        assert stored is not None
        assert stored.action_taken == "approve"
        assert "บำนาญ" in stored.feedback


@pytest.mark.asyncio
async def test_full_phase6_journey():
    """Test full journey: Customer -> AI Score -> Insight -> Need Analysis -> Product Match -> Broker Decision."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Select Customer
        list_res = await client.get("/customers?page=1&page_size=1", headers=headers)
        customer_id = list_res.json()["items"][0]["id"]

        # 2. Run ML Scoring
        analyze_res = await client.post(f"/customers/{customer_id}/analyze", headers=headers)
        assert analyze_res.status_code == 200
        score = analyze_res.json()["score"]

        # 3. Generate Insight
        insight_res = await client.get(f"/customers/{customer_id}/insights", headers=headers)
        assert insight_res.status_code == 200

        # 4. Run Need Analysis
        needs_res = await client.get(f"/customers/{customer_id}/needs", headers=headers)
        assert needs_res.status_code == 200

        # 5. Product Matching
        recs_res = await client.get(f"/customers/{customer_id}/recommendations", headers=headers)
        assert recs_res.status_code == 200
        top_rec = recs_res.json()["recommendations"][0]

        # 6. Broker Decision (Modify)
        dec_res = await client.post(
            f"/customers/{customer_id}/recommendations/{top_rec['recommendation_id']}/decision",
            headers=headers,
            json={
                "action": "modify",
                "feedback": "ปรับลดทุนประกันลงเพื่อให้อยู่ในงบประมาณเบี้ยรายปีของลูกค้า",
            },
        )
        assert dec_res.status_code == 200
        assert dec_res.json()["action_taken"] == "modify"
