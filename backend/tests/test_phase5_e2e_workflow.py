"""
End-to-End Workflow Test for Phase 5:
Full journey: Login -> Dashboard Summary -> Priority List -> Customer Detail -> Real AI Analysis -> Score & TreeSHAP Explanation.
"""
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.seed import seed_database


@pytest.mark.asyncio
async def test_full_phase5_end_to_end_workflow():
    """
    Simulates a broker logging in, browsing the dashboard, selecting a customer,
    running LightGBM + TreeSHAP analysis, and viewing the detailed explainability factors.
    """
    # 1. Seed database with synthetic demo customers
    await seed_database(num_customers=10)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Step 1: Login as Broker
        login_res = await client.post("/auth/login", json={
            "email": "broker@demo.local",
            "password": "demo1234",
        })
        assert login_res.status_code == 200
        auth_data = login_res.json()
        token = auth_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Step 2: Dashboard Summary & Priority Counts
        summary_res = await client.get("/dashboard/summary", headers=headers)
        assert summary_res.status_code == 200
        summary = summary_res.json()
        assert summary["total_customers"] >= 1
        assert "priority_breakdown" in summary
        assert "high" in summary["priority_breakdown"]
        assert "overdue_followups_count" in summary

        # Step 3: Fetch Customer List
        list_res = await client.get("/customers?page=1&page_size=10", headers=headers)
        assert list_res.status_code == 200
        customers = list_res.json()["items"]
        assert len(customers) > 0
        target_customer = customers[0]
        customer_id = target_customer["id"]

        # Step 4: Customer Detail & Profile
        detail_res = await client.get(f"/customers/{customer_id}", headers=headers)
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert detail["id"] == customer_id
        assert "profile" in detail
        assert "financial_profile" in detail
        assert "insurance_policies" in detail

        # Step 5: Trigger Real AI Analysis (LightGBM + TreeSHAP)
        analyze_res = await client.post(f"/customers/{customer_id}/analyze", headers=headers)
        assert analyze_res.status_code == 200
        analysis = analyze_res.json()

        # Step 6: Validate Score & TreeSHAP Factors
        assert analysis["customer_id"] == customer_id
        assert 0 <= analysis["score"] <= 100
        assert analysis["priority_level"] in ("high", "medium", "low")
        assert len(analysis["factors"]) >= 1
        for factor in analysis["factors"]:
            assert "feature" in factor
            assert "label" in factor
            assert "impact" in factor
            assert factor["impact"] in ("positive", "negative")
            assert "importance" in factor
            assert factor["importance"] >= 0.0

        # Step 7: Verify Sync in Database & Customer Detail
        refreshed_detail_res = await client.get(f"/customers/{customer_id}", headers=headers)
        assert refreshed_detail_res.status_code == 200
        refreshed = refreshed_detail_res.json()
        assert refreshed["latest_score"] is not None
        assert refreshed["latest_score"]["score_display"] == analysis["score"]
