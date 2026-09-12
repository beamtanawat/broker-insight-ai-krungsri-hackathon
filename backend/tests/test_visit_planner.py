"""
Unit and integration tests for Visit Planner Backend Foundation (Phase 2).
Tests cover:
- Configuration retrieval (office hours, travel limits, start/end locations)
- Candidate retrieval with existing intelligence (priority, Why Now, action, protection gap)
- Location handling (accurate coordinates vs missing location without fabrication)
- RBAC isolation (broker self-access vs manager multi-broker access)
- Validation rules:
  * empty customer list
  * duplicate customer IDs
  * nonexistent customer IDs
  * unauthorized customer access
  * impossible office hours (inverted hours, window too small)
  * negative limits (travel time, distance, duration)
  * coordinate bounds checking ([-90, 90], [-180, 180])
"""
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.security import create_access_token
from app.core.seed import seed_database
from app.models.user import User
from app.models.customer import Customer
from tests.conftest import TestAsyncSession



@pytest.fixture(autouse=True)
async def seed_demo_data():
    """Seed synthetic customer base with coordinates and hero personas."""
    await seed_database(num_customers=25)


async def get_auth_token(email: str = "broker@demo.local", role: str = "broker") -> str:
    """Helper to get JWT token for a seeded user."""
    async with TestAsyncSession() as db:
        res = await db.execute(User.__table__.select().where(User.email == email))
        user = res.first()
        assert user is not None, f"User with email {email} not found in seeded database"
        return create_access_token(user.id, role)


# ── 1. Configuration Tests ──────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_visit_planner_config():
    """Test GET /api/v1/visit-planner/config returns default operational constraints and hub offices."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/v1/visit-planner/config", headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert "office_start_time" in data
    assert "office_end_time" in data
    assert data["max_daily_travel_time_minutes"] > 0
    assert data["max_daily_distance_km"] > 0
    assert "start_location" in data
    assert "end_location" in data
    assert -90.0 <= data["start_location"]["latitude"] <= 90.0
    assert -180.0 <= data["start_location"]["longitude"] <= 180.0
    assert len(data["available_offices"]) >= 3


# ── 2. Candidate Retrieval & Intelligence Reuse ──────────────────────

@pytest.mark.asyncio
async def test_get_candidates_reusing_intelligence():
    """Test GET /api/v1/visit-planner/candidates retrieves customers with intelligence fields."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/v1/visit-planner/candidates", headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert data["total"] >= 5
    assert data["routable_count"] >= 1

    first_item = data["items"][0]
    assert "customer_id" in first_item
    assert "customer_name" in first_item
    assert "external_ref" in first_item
    assert "priority_score" in first_item
    assert "priority_level" in first_item
    assert "why_now" in first_item
    assert "recommended_next_action" in first_item
    assert "action_state" in first_item
    assert "routable" in first_item


# ── 3. Missing Location Handling (No Fabrication) ────────────────────

@pytest.mark.asyncio
async def test_missing_location_handling():
    """
    Test customer with coordinates (e.g. KS-00001) vs customer without coordinates (e.g. KS-00003).
    Verifies that missing location is marked properly and no coordinates are fabricated.
    """
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/v1/visit-planner/candidates?page_size=30", headers=headers)

    assert res.status_code == 200
    data = res.json()
    items = data["items"]

    # Locate KS-00001 (has location)
    ks1 = next((item for item in items if item["external_ref"] == "KS-00001"), None)
    assert ks1 is not None
    assert ks1["location_available"] is True
    assert ks1["routable"] is True
    assert ks1["latitude"] is not None
    assert ks1["longitude"] is not None
    assert ks1["unroutable_reason"] is None
    assert "ทองหล่อ" in str(ks1["address"]) or "วัฒนา" in str(ks1["district"])

    # Locate KS-00003 (missing location)
    ks3 = next((item for item in items if item["external_ref"] == "KS-00003"), None)
    assert ks3 is not None
    assert ks3["location_available"] is False
    assert ks3["routable"] is False
    assert ks3["latitude"] is None
    assert ks3["longitude"] is None
    assert ks3["unroutable_reason"] is not None
    assert "ไม่สมบูรณ์" in ks3["unroutable_reason"] or "Missing" in ks3["unroutable_reason"]


@pytest.mark.asyncio
async def test_candidates_location_only_filter():
    """Test location_only=true returns strictly routable customers."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/v1/visit-planner/candidates?location_only=true", headers=headers)

    assert res.status_code == 200
    data = res.json()
    for item in data["items"]:
        assert item["location_available"] is True
        assert item["routable"] is True
        assert item["latitude"] is not None
        assert item["longitude"] is not None


# ── 4. RBAC Authorization Tests ──────────────────────────────────────

@pytest.mark.asyncio
async def test_rbac_broker_cannot_query_other_broker():
    """Test that a broker cannot specify another broker_id."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/v1/visit-planner/candidates?broker_id=other-broker-uuid", headers=headers)

    assert res.status_code == 403
    assert "only access their own" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_rbac_manager_can_access_all():
    """Test that a manager can access candidates without broker isolation restriction."""
    token = await get_auth_token("manager@demo.local", "manager")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/v1/visit-planner/candidates", headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 5


# ── 5. Validation API Tests ──────────────────────────────────────────

@pytest.mark.asyncio
async def test_validate_valid_configuration():
    """Test POST /api/v1/visit-planner/validate with valid inputs returns valid=True."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "customer_ids": ["KS-00001", "KS-00002"],
        "office_start_time": "08:30",
        "office_end_time": "17:30",
        "max_daily_travel_time_minutes": 150,
        "max_daily_distance_km": 60.0,
        "meeting_duration_minutes": 45,
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/validate", json=payload, headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is True
    assert len(data["errors"]) == 0
    assert data["routable_count"] == 2
    assert data["unroutable_count"] == 0
    assert "office_start_time" in data["effective_config"]


@pytest.mark.asyncio
async def test_validate_missing_location_warning():
    """Test POST /api/v1/visit-planner/validate warns about customers lacking GPS."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "customer_ids": ["KS-00001", "KS-00003"],  # KS-00003 has no location
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/validate", json=payload, headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["routable_count"] == 1
    assert data["unroutable_count"] == 1
    assert len(data["warnings"]) >= 1
    assert any("KS-00003" in w or "ปิยะ" in w for w in data["warnings"])


@pytest.mark.asyncio
async def test_validate_empty_customer_list():
    """Test POST /api/v1/visit-planner/validate rejects empty customer lists."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "customer_ids": [],
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/validate", json=payload, headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is False
    assert any("empty" in e.lower() or "ว่าง" in e for e in data["errors"])
    assert any(i["code"] == "EMPTY_CUSTOMER_LIST" for i in data["issues"])


@pytest.mark.asyncio
async def test_validate_duplicate_customer_ids():
    """Test POST /api/v1/visit-planner/validate detects and flags duplicate customer IDs."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "customer_ids": ["KS-00001", "KS-00002", "KS-00001"],
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/validate", json=payload, headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is False
    assert any("duplicate" in e.lower() or "ซ้ำ" in e for e in data["errors"])
    assert any(i["code"] == "DUPLICATE_CUSTOMER_IDS" for i in data["issues"])


@pytest.mark.asyncio
async def test_validate_nonexistent_customer_id():
    """Test POST /api/v1/visit-planner/validate rejects nonexistent customer IDs."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "customer_ids": ["KS-99999-NOT-EXIST"],
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/validate", json=payload, headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is False
    assert any(i["code"] == "CUSTOMER_NOT_FOUND" for i in data["issues"])


@pytest.mark.asyncio
async def test_validate_impossible_office_hours():
    """Test POST /api/v1/visit-planner/validate rejects impossible office hours."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    # Case A: End time before start time
    payload_inverted = {
        "customer_ids": ["KS-00001"],
        "office_start_time": "17:30",
        "office_end_time": "08:30",
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/validate", json=payload_inverted, headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is False
    assert any(i["code"] == "INVALID_OFFICE_HOURS" for i in data["issues"])

    # Case B: Available window shorter than meeting duration
    payload_window_too_short = {
        "customer_ids": ["KS-00001"],
        "office_start_time": "09:00",
        "office_end_time": "09:20",
        "meeting_duration_minutes": 45,
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res2 = await client.post("/api/v1/visit-planner/validate", json=payload_window_too_short, headers=headers)

    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["valid"] is False
    assert any(i["code"] == "IMPOSSIBLE_OFFICE_HOURS" for i in data2["issues"])


@pytest.mark.asyncio
async def test_validate_negative_or_invalid_limits():
    """Test POST /api/v1/visit-planner/validate rejects negative or zero limits."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "customer_ids": ["KS-00001"],
        "max_daily_travel_time_minutes": -30,
        "max_daily_distance_km": 0,
        "meeting_duration_minutes": -15,
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/validate", json=payload, headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is False
    limit_issues = [i for i in data["issues"] if i["code"] == "INVALID_LIMITS"]
    assert len(limit_issues) >= 2


@pytest.mark.asyncio
async def test_validate_invalid_coordinates():
    """Test POST /api/v1/visit-planner/validate rejects out-of-range coordinates."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "customer_ids": ["KS-00001"],
        "start_location": {
            "name": "Invalid Office",
            "latitude": 195.0,  # Invalid: > 90
            "longitude": 100.0,
        },
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/validate", json=payload, headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is False
    assert any(i["code"] == "INVALID_COORDINATES" for i in data["issues"])


@pytest.mark.asyncio
async def test_api_query_validation():
    """Test FastAPI query parameter validation for candidates endpoint."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Invalid page (ge=1 violated)
        res = await client.get("/api/v1/visit-planner/candidates?page=0", headers=headers)

    assert res.status_code in (400, 422)


# ── 6. Phase 3 Route Optimization Engine Tests ───────────────────────

@pytest.mark.asyncio
async def test_route_optimize_basic_route():
    """Test 1: Basic feasible route with 2 customers starting and ending at office."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "customer_ids": ["KS-00001", "KS-00002"],
        "office_start_time": "08:30",
        "office_end_time": "17:30",
        "max_daily_travel_time_minutes": 150,
        "max_daily_distance_km": 60.0,
        "meeting_duration_minutes": 45,
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/optimize", json=payload, headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "feasible"
    assert data["is_feasible"] is True
    assert data["customer_stops_count"] == 2
    assert data["total_stops"] == 4  # Start Office, Customer 1, Customer 2, End Office
    assert len(data["ordered_stops"]) == 4

    # Check stops order and structure
    stops = data["ordered_stops"]
    assert stops[0]["stop_type"] == "office_start"
    assert stops[0]["stop_order"] == 0
    assert stops[0]["arrival_time"] == "08:30"
    assert stops[0]["departure_time"] == "08:30"
    assert stops[0]["meeting_duration_minutes"] == 0

    assert stops[1]["stop_type"] == "customer"
    assert stops[1]["stop_order"] == 1
    assert stops[1]["customer"] is not None
    assert stops[1]["meeting_duration_minutes"] == 45
    assert stops[1]["travel_time_from_prev_minutes"] > 0

    assert stops[2]["stop_type"] == "customer"
    assert stops[2]["stop_order"] == 2
    assert stops[2]["customer"] is not None
    assert stops[2]["meeting_duration_minutes"] == 45

    assert stops[3]["stop_type"] == "office_end"
    assert stops[3]["stop_order"] == 3
    assert stops[3]["meeting_duration_minutes"] == 0

    # Distance and Travel Time
    assert data["total_distance_km"] > 0.0
    assert data["total_travel_time_minutes"] > 0.0
    assert data["total_meeting_time_minutes"] == 90  # 2 * 45
    assert data["total_duration_minutes"] > 90.0

    # Constraint Utilization
    util = data["constraint_utilization"]
    assert util["travel_time_minutes"] == data["total_travel_time_minutes"]
    assert util["distance_km"] == data["total_distance_km"]
    assert 0 < util["travel_time_utilization_pct"] < 100
    assert 0 < util["distance_utilization_pct"] < 100
    assert data["violated_constraints"] == []
    assert len(data["explanations"]) >= 2


@pytest.mark.asyncio
async def test_route_optimize_multiple_customers():
    """Test 2: Multiple customers (3-4 customers) ordered in coherent sequence."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "customer_ids": ["KS-00001", "KS-00002", "KS-00004"],
        "meeting_duration_minutes": 45,
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/optimize", json=payload, headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "feasible"
    assert data["customer_stops_count"] == 3
    assert data["total_stops"] == 5

    # Check chronological timeline progression
    stops = data["ordered_stops"]
    prev_dep = stops[0]["departure_time"]
    for s in stops[1:]:
        assert s["arrival_time"] >= prev_dep
        assert s["departure_time"] >= s["arrival_time"]
        prev_dep = s["departure_time"]


@pytest.mark.asyncio
async def test_route_optimize_priority_differences():
    """Test 3: Customer priority and urgency influences visit order."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    # KS-00001 has Score 92 (High), KS-00005 has Score 40 (Low)
    payload = {
        "customer_ids": ["KS-00005", "KS-00001"],
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/optimize", json=payload, headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["customer_stops_count"] == 2
    stops = [s for s in data["ordered_stops"] if s["stop_type"] == "customer"]
    # High priority customer (KS-00001) is placed first due to priority weighting and close proximity
    assert stops[0]["customer"]["external_ref"] == "KS-00001"


@pytest.mark.asyncio
async def test_route_optimize_nearby_clustering():
    """Test 4: Geographic clustering groups nearby customers without erratic zig-zag."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "customer_ids": ["KS-00001", "KS-00002", "KS-00004", "KS-00005"],
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/optimize", json=payload, headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["customer_stops_count"] == 4
    # Distance of optimized loop should be strictly less than an unoptimized arbitrary order
    assert data["total_distance_km"] < 60.0
    # Geographic clustering explanation included
    assert any("ลด" in exp or "วงรอบ" in exp or "พื้นที่" in exp for exp in data["explanations"])


@pytest.mark.asyncio
async def test_route_optimize_office_hours_violation():
    """Test 5: Office hours violation returns infeasible, identifies constraint, and suggests deferrals."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    # Tight office window: 08:30 to 10:00 (90 mins), with 2 customers (2 x 45 min = 90 min + transit > 90 min)
    payload = {
        "customer_ids": ["KS-00001", "KS-00002"],
        "office_start_time": "08:30",
        "office_end_time": "09:45",
        "meeting_duration_minutes": 45,
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/optimize", json=payload, headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "infeasible"
    assert data["is_feasible"] is False
    assert len(data["violated_constraints"]) >= 1

    # Check violated constraint structure
    violation = next((v for v in data["violated_constraints"] if v["constraint"] == "office_hours"), None)
    assert violation is not None
    assert violation["allowed"] == "09:45"
    assert violation["actual"] > "09:45"
    assert "เกินเวลาปิดทำการ" in violation["message"]

    # Check that deferrals are suggested without dropping customers from ordered_stops
    assert len(data["suggested_deferrals"]) >= 1
    assert data["customer_stops_count"] == 2
    assert len(data["ordered_stops"]) == 4


@pytest.mark.asyncio
async def test_route_optimize_max_travel_time_violation():
    """Test 6: Exceeding maximum daily travel time reports infeasible with actual vs allowed."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    # Set unrealistically low travel time limit (5 mins)
    payload = {
        "customer_ids": ["KS-00001", "KS-00002"],
        "max_daily_travel_time_minutes": 5,
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/optimize", json=payload, headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "infeasible"
    assert data["is_feasible"] is False

    violation = next((v for v in data["violated_constraints"] if v["constraint"] == "max_travel_time"), None)
    assert violation is not None
    assert violation["actual"] > violation["allowed"]
    assert violation["allowed"] == 5.0
    assert len(data["suggested_deferrals"]) >= 1


@pytest.mark.asyncio
async def test_route_optimize_max_distance_violation():
    """Test 7: Exceeding maximum daily distance reports infeasible with actual vs allowed."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    # Set unrealistically low distance limit (2.0 km)
    payload = {
        "customer_ids": ["KS-00001", "KS-00002"],
        "max_daily_distance_km": 2.0,
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/optimize", json=payload, headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "infeasible"
    assert data["is_feasible"] is False

    violation = next((v for v in data["violated_constraints"] if v["constraint"] == "max_distance"), None)
    assert violation is not None
    assert violation["actual"] > violation["allowed"]
    assert violation["allowed"] == 2.0
    assert len(data["suggested_deferrals"]) >= 1


@pytest.mark.asyncio
async def test_route_optimize_start_end_handling():
    """Test 8: Custom start and end office locations are correctly positioned as stop 0 and stop N+1."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    custom_start = {
        "name": "ธนาคารกรุงศรีอยุธยา อาคารกรุงศรี เพลินจิต ทาวเวอร์",
        "address": "550 ถนนเพลินจิต แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ",
        "latitude": 13.7428,
        "longitude": 100.5471,
    }
    custom_end = {
        "name": "ธนาคารกรุงศรีอยุธยา สาขาอโศก (อาคารอินเตอร์เชนจ์ 21)",
        "address": "399 ถนนสุขุมวิท 21 แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพฯ",
        "latitude": 13.7381,
        "longitude": 100.5606,
    }

    payload = {
        "customer_ids": ["KS-00001"],
        "start_location": custom_start,
        "end_location": custom_end,
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/optimize", json=payload, headers=headers)

    assert res.status_code == 200
    data = res.json()
    stops = data["ordered_stops"]
    assert len(stops) == 3
    assert stops[0]["stop_type"] == "office_start"
    assert stops[0]["latitude"] == 13.7428
    assert stops[0]["longitude"] == 100.5471
    assert "เพลินจิต" in stops[0]["location_name"]

    assert stops[2]["stop_type"] == "office_end"
    assert stops[2]["latitude"] == 13.7381
    assert stops[2]["longitude"] == 100.5606
    assert "อโศก" in stops[2]["location_name"]


@pytest.mark.asyncio
async def test_route_optimize_missing_location():
    """Test 9: Customers without coordinates are excluded from routing and flagged in unroutable_customers."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    # KS-00001 (has location) + KS-00003 (missing location)
    payload = {
        "customer_ids": ["KS-00001", "KS-00003"],
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/optimize", json=payload, headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["customer_stops_count"] == 1  # Only KS-00001 routed
    assert len(data["unroutable_customers"]) == 1
    assert data["unroutable_customers"][0]["external_ref"] == "KS-00003"
    assert data["unroutable_customers"][0]["routable"] is False


@pytest.mark.asyncio
async def test_route_optimize_empty_input():
    """Test 10: Empty customer list returns empty response with status='empty' gracefully."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "customer_ids": [],
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/optimize", json=payload, headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "empty"
    assert data["total_stops"] == 0
    assert data["ordered_stops"] == []
    assert data["total_distance_km"] == 0.0


@pytest.mark.asyncio
async def test_route_optimize_deterministic_output():
    """Test 11: Given identical inputs and data, the route produces 100% identical results."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "customer_ids": ["KS-00004", "KS-00001", "KS-00002"],
        "office_start_time": "08:30",
        "office_end_time": "17:30",
        "max_daily_travel_time_minutes": 150,
        "max_daily_distance_km": 60.0,
        "meeting_duration_minutes": 45,
    }

    results = []
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for _ in range(3):
            res = await client.post("/api/v1/visit-planner/optimize", json=payload, headers=headers)
            assert res.status_code == 200
            results.append(res.json())

    # Verify bit-for-bit identical results across runs
    run1, run2, run3 = results[0], results[1], results[2]
    assert run1["total_distance_km"] == run2["total_distance_km"] == run3["total_distance_km"]
    assert run1["total_travel_time_minutes"] == run2["total_travel_time_minutes"] == run3["total_travel_time_minutes"]
    assert run1["estimated_return_time"] == run2["estimated_return_time"] == run3["estimated_return_time"]

    stops1 = [s["customer"]["external_ref"] for s in run1["ordered_stops"] if s["stop_type"] == "customer"]
    stops2 = [s["customer"]["external_ref"] for s in run2["ordered_stops"] if s["stop_type"] == "customer"]
    stops3 = [s["customer"]["external_ref"] for s in run3["ordered_stops"] if s["stop_type"] == "customer"]
    assert stops1 == stops2 == stops3
    assert run1["explanations"] == run2["explanations"] == run3["explanations"]


# ── 7. RBAC & Audit Verification for Optimize ────────────────────────

@pytest.mark.asyncio
async def test_route_optimize_rbac_cross_broker_forbidden():
    """Test Broker cannot optimize route for customers assigned to another broker."""
    # Reassign KS-00005 to another broker in test database
    async with TestAsyncSession() as db:
        res = await db.execute(User.__table__.select().where(User.email == "broker1@demo.local"))
        other_broker = res.first()
        assert other_broker is not None
        await db.execute(
            Customer.__table__.update()
            .where(Customer.external_ref == "KS-00005")
            .values(assigned_broker_id=other_broker.id)
        )
        await db.commit()

    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "customer_ids": ["KS-00005"],
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/optimize", json=payload, headers=headers)

    assert res.status_code == 403
    assert "only optimize routes for their assigned customers" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_route_optimize_audit_logging():
    """Test that optimizing a route generates an audit log record."""
    broker_token = await get_auth_token("broker@demo.local", "broker")
    manager_token = await get_auth_token("manager@demo.local", "manager")
    broker_headers = {"Authorization": f"Bearer {broker_token}"}
    manager_headers = {"Authorization": f"Bearer {manager_token}"}

    payload = {
        "customer_ids": ["KS-00001"],
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/optimize", json=payload, headers=broker_headers)
        assert res.status_code == 200

        # Check audit log as manager
        audit_res = await client.get("/api/v1/audit/?page_size=10", headers=manager_headers)
        assert audit_res.status_code == 200
        logs = audit_res.json()["items"]
        assert any(l["action"] == "VISIT_PLANNER_ROUTE_OPTIMIZED" for l in logs)


# ── 8. Phase 4 Decision Support API Tests (POST /visit-planner/route) ──

@pytest.mark.asyncio
async def test_decision_support_correct_customer_data_and_intelligence():
    """Test Phase 4: POST /route returns rich customer intelligence, Why Now, action, and stop rationale."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "customer_ids": ["KS-00001", "KS-00002"],
        "meeting_duration_minutes": 45,
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/route", json=payload, headers=headers)

    assert res.status_code == 200
    data = res.json()

    # High-level decision metrics
    assert data["status"] == "feasible"
    assert data["is_feasible"] is True
    assert data["total_customers_to_visit"] == 2
    assert data["total_stops"] == 4  # Start depot, Visit 1, Visit 2, Return depot
    assert len(data["visits"]) == 2

    # Verify Stop 1 (KS-00001)
    v1 = data["visits"][0]
    assert v1["visit_order"] == 1
    assert v1["customer"]["external_ref"] == "KS-00001"
    assert "ณัฐพร" in v1["customer"]["customer_name"]
    assert v1["customer"]["relationship_tier"] == "Platinum"
    assert v1["priority_level"] == "high"
    assert v1["priority_score"] == 92
    assert "14 วัน" in v1["why_now"]  # Imminent renewal in 14 days
    assert "ประกันสุขภาพ" in v1["recommended_next_action"]
    assert v1["location"]["district"] == "วัฒนา"
    assert v1["location"]["latitude"] is not None
    assert v1["location"]["longitude"] is not None
    assert "จัดเข้าพบเป็นลำดับที่ 1" in v1["explanation"]

    # Verify Stop 2 (KS-00002)
    v2 = data["visits"][1]
    assert v2["visit_order"] == 2
    assert v2["customer"]["external_ref"] == "KS-00002"
    assert v2["priority_level"] == "high"
    assert "21 วัน" in v2["why_now"] or "motor" in v2["why_now"].lower()
    assert v2["meeting_duration_minutes"] == 45


@pytest.mark.asyncio
async def test_decision_support_route_kpis_and_working_window():
    """Test Phase 4: Route answers total time, working window utilization, limits, and optimization summary."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "customer_ids": ["KS-00001", "KS-00002"],
        "office_start_time": "08:30",
        "office_end_time": "17:30",
        "max_daily_travel_time_minutes": 150,
        "max_daily_distance_km": 60.0,
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/route", json=payload, headers=headers)

    assert res.status_code == 200
    data = res.json()

    # Route time & distance
    assert data["total_distance_km"] > 0
    assert data["total_travel_time_minutes"] > 0
    assert data["total_meeting_time_minutes"] == 90  # 2 * 45
    assert data["total_duration_minutes"] == round(data["total_travel_time_minutes"] + 90, 1)

    # Working Window
    ww = data["working_window"]
    assert ww["office_start_time"] == "08:30"
    assert ww["office_end_time"] == "17:30"
    assert ww["window_minutes"] == 540.0
    assert ww["used_minutes"] == data["total_duration_minutes"]
    assert ww["remaining_minutes"] > 0
    assert 0 < ww["utilization_pct"] < 100
    assert ww["estimated_return_time"] < "17:30"

    # Limits
    lim = data["limits"]
    assert lim["max_travel_time_minutes"] == 150
    assert lim["actual_travel_time_minutes"] == data["total_travel_time_minutes"]
    assert lim["max_distance_km"] == 60.0
    assert lim["actual_distance_km"] == data["total_distance_km"]

    # Transparent Optimization Summary
    opt_sum = data["optimization_summary"]
    assert opt_sum is not None
    assert "priority_influence" in opt_sum
    assert "urgency_influence" in opt_sum
    assert "efficiency_influence" in opt_sum
    assert len(opt_sum["priority_influence"]) > 10
    assert len(opt_sum["urgency_influence"]) > 10


@pytest.mark.asyncio
async def test_decision_support_correct_route_order_priority():
    """Test Phase 4: Optimizer answers 'In what order?' prioritizing critical accounts."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    # Pass in low priority first, then high priority
    payload = {
        "customer_ids": ["KS-00005", "KS-00001"],
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/route", json=payload, headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["visits"][0]["customer"]["external_ref"] == "KS-00001"
    assert data["visits"][0]["visit_order"] == 1
    assert data["visits"][0]["priority_score"] == 92
    assert data["visits"][1]["customer"]["external_ref"] == "KS-00005"
    assert data["visits"][1]["visit_order"] == 2


@pytest.mark.asyncio
async def test_decision_support_infeasible_route_and_constraints():
    """Test Phase 4: Infeasible route explicitly flags violated constraints and returns deferral options."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    # Tight office window: 08:30 to 09:30 (60 min) with 2 customer meetings (90 min + transit > 90 min)
    payload = {
        "customer_ids": ["KS-00001", "KS-00002"],
        "office_start_time": "08:30",
        "office_end_time": "09:30",
        "meeting_duration_minutes": 45,
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/route", json=payload, headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "infeasible"
    assert data["is_feasible"] is False
    assert len(data["violated_constraints"]) >= 1

    violation = data["violated_constraints"][0]
    assert violation["constraint"] == "office_hours"
    assert violation["allowed"] == "09:30"
    assert violation["actual"] > "09:30"

    # Both visits still returned so broker can make informed decision
    assert len(data["visits"]) == 2
    assert len(data["suggested_deferrals"]) >= 1


@pytest.mark.asyncio
async def test_decision_support_missing_locations():
    """Test Phase 4: Customer with missing location (KS-00003) is cleanly isolated in unroutable_customers."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "customer_ids": ["KS-00001", "KS-00003"],
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/route", json=payload, headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["total_customers_to_visit"] == 1
    assert len(data["visits"]) == 1
    assert data["visits"][0]["customer"]["external_ref"] == "KS-00001"
    assert len(data["unroutable_customers"]) == 1
    assert data["unroutable_customers"][0]["external_ref"] == "KS-00003"
    assert data["unroutable_customers"][0]["routable"] is False


@pytest.mark.asyncio
async def test_decision_support_rbac_isolation():
    """Test Phase 4: Broker cannot request route for customer assigned to another broker."""
    async with TestAsyncSession() as db:
        res = await db.execute(User.__table__.select().where(User.email == "broker1@demo.local"))
        other_broker = res.first()
        assert other_broker is not None
        await db.execute(
            Customer.__table__.update()
            .where(Customer.external_ref == "KS-00005")
            .values(assigned_broker_id=other_broker.id)
        )
        await db.commit()

    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "customer_ids": ["KS-00005"],
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/route", json=payload, headers=headers)

    assert res.status_code == 403
    assert "only optimize routes for their assigned customers" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_decision_support_malformed_requests():
    """Test Phase 4: Malformed inputs (invalid format, impossible hours, negative caps, nonexistent ID) are rejected."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Invalid time format
        res1 = await client.post(
            "/api/v1/visit-planner/route",
            json={"customer_ids": ["KS-00001"], "office_start_time": "invalid"},
            headers=headers,
        )
        assert res1.status_code == 400
        assert "format" in res1.json()["detail"].lower()

        # 2. Inverted office hours (start after end)
        res2 = await client.post(
            "/api/v1/visit-planner/route",
            json={"customer_ids": ["KS-00001"], "office_start_time": "18:00", "office_end_time": "08:00"},
            headers=headers,
        )
        assert res2.status_code == 400
        assert "after start time" in res2.json()["detail"].lower()

        # 3. Nonexistent customer ID
        res3 = await client.post(
            "/api/v1/visit-planner/route",
            json={"customer_ids": ["KS-99999"]},
            headers=headers,
        )
        assert res3.status_code == 404

        # 4. Negative limits
        res4 = await client.post(
            "/api/v1/visit-planner/route",
            json={"customer_ids": ["KS-00001"], "max_daily_travel_time_minutes": -5},
            headers=headers,
        )
        assert res4.status_code == 400

        # 5. Out of range coordinates
        res5 = await client.post(
            "/api/v1/visit-planner/route",
            json={
                "customer_ids": ["KS-00001"],
                "start_location": {"latitude": 190.0, "longitude": 100.0},
            },
            headers=headers,
        )
        assert res5.status_code == 400


@pytest.mark.asyncio
async def test_decision_support_audit_logging():
    """Test Phase 4: Decision support route generation records VISIT_PLANNER_DECISION_SUPPORT_GENERATED."""
    broker_token = await get_auth_token("broker@demo.local", "broker")
    manager_token = await get_auth_token("manager@demo.local", "manager")
    broker_headers = {"Authorization": f"Bearer {broker_token}"}
    manager_headers = {"Authorization": f"Bearer {manager_token}"}

    payload = {
        "customer_ids": ["KS-00001"],
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/route", json=payload, headers=broker_headers)
        assert res.status_code == 200

        # Check audit log as manager
        audit_res = await client.get("/api/v1/audit/?page_size=10", headers=manager_headers)
        assert audit_res.status_code == 200
        logs = audit_res.json()["items"]
        assert any(l["action"] == "VISIT_PLANNER_DECISION_SUPPORT_GENERATED" for l in logs)


# ── 11. Phase 7: Nearby Customer Discovery Tests ──────────────────────

@pytest.mark.asyncio
async def test_nearby_customer_discovery_with_radius():
    """Test Phase 7: GET /candidates with origin coordinates and radius returns distance_km within radius."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    # Krungsri Rama 3 coordinates
    origin_lat = 13.6827
    origin_lng = 100.5478
    radius_km = 10.0

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get(
            f"/api/v1/visit-planner/candidates?origin_lat={origin_lat}&origin_lng={origin_lng}&radius_km={radius_km}&sort_by=distance",
            headers=headers,
        )

    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    for item in data["items"]:
        assert item["distance_km"] is not None
        assert item["distance_km"] <= radius_km
        assert "why_now" in item
        assert "recommended_next_action" in item
        assert "priority_level" in item


@pytest.mark.asyncio
async def test_nearby_customer_discovery_radius_scaling():
    """Test Phase 7: 5 km radius returns fewer or equal candidates than 20 km radius."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    origin_lat = 13.6827
    origin_lng = 100.5478

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res_5km = await client.get(
            f"/api/v1/visit-planner/candidates?origin_lat={origin_lat}&origin_lng={origin_lng}&radius_km=5.0",
            headers=headers,
        )
        res_20km = await client.get(
            f"/api/v1/visit-planner/candidates?origin_lat={origin_lat}&origin_lng={origin_lng}&radius_km=20.0",
            headers=headers,
        )

    assert res_5km.status_code == 200
    assert res_20km.status_code == 200
    data_5km = res_5km.json()
    data_20km = res_20km.json()

    assert data_5km["total"] <= data_20km["total"]


@pytest.mark.asyncio
async def test_nearby_customer_sort_by_distance():
    """Test Phase 7: GET /candidates sort_by=distance returns items ordered by distance."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    origin_lat = 13.6827
    origin_lng = 100.5478

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get(
            f"/api/v1/visit-planner/candidates?origin_lat={origin_lat}&origin_lng={origin_lng}&sort_by=distance",
            headers=headers,
        )

    assert res.status_code == 200
    data = res.json()
    items = data["items"]
    # Filter items that have distance_km
    dist_items = [i["distance_km"] for i in items if i["distance_km"] is not None]
    if len(dist_items) >= 2:
        for i in range(len(dist_items) - 1):
            assert dist_items[i] <= dist_items[i + 1]


# ── 12. Phases 8–10: Dedicated Nearby Customers & On-Demand Navigation ──────

@pytest.mark.asyncio
async def test_nearby_endpoint_valid_request():
    """Test Phases 8-10: GET /nearby-customers returns customers strictly within radius."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    origin_lat = 13.6827
    origin_lng = 100.5478
    radius_km = 10.0

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get(
            f"/api/v1/visit-planner/nearby-customers?broker_lat={origin_lat}&broker_lng={origin_lng}&radius_km={radius_km}&sort_by=distance",
            headers=headers,
        )

    assert res.status_code == 200
    data = res.json()
    assert "broker_origin" in data
    assert data["broker_origin"]["latitude"] == origin_lat
    assert data["broker_origin"]["longitude"] == origin_lng
    assert data["radius_km"] == radius_km
    assert "total_nearby" in data
    assert "items" in data
    assert "excluded_missing_location_count" in data
    assert data["distance_calculation_method"] == "haversine_great_circle"

    for item in data["items"]:
        assert item["distance_km"] <= radius_km
        assert "customer_id" in item
        assert "customer_name" in item
        assert "why_now" in item
        assert "recommended_next_action" in item
        assert "distance_label" in item


@pytest.mark.asyncio
async def test_nearby_endpoint_invalid_coordinates():
    """Test Phases 8-10: GET /nearby-customers rejects out-of-bounds coordinates."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Invalid latitude (> 90.0)
        res_lat = await client.get(
            "/api/v1/visit-planner/nearby-customers?broker_lat=95.0&broker_lng=100.5478&radius_km=10.0",
            headers=headers,
        )
        assert res_lat.status_code in [400, 422]

        # Invalid longitude (> 180.0)
        res_lng = await client.get(
            "/api/v1/visit-planner/nearby-customers?broker_lat=13.6827&broker_lng=195.0&radius_km=10.0",
            headers=headers,
        )
        assert res_lng.status_code in [400, 422]


@pytest.mark.asyncio
async def test_nearby_endpoint_rbac_broker_forbidden():
    """Test Phases 8-10: Broker cannot query another broker's nearby customers."""
    broker_token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {broker_token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get(
            "/api/v1/visit-planner/nearby-customers?broker_lat=13.6827&broker_lng=100.5478&radius_km=10.0&broker_id=other-broker-id",
            headers=headers,
        )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_navigation_endpoint_valid_request():
    """Test Phases 9-10: POST /navigate generates on-demand point-to-point navigation to selected customer."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    # Find a valid routable customer ID
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        c_res = await client.get("/api/v1/visit-planner/candidates?location_only=true", headers=headers)
        assert c_res.status_code == 200
        items = c_res.json()["items"]
        assert len(items) >= 1
        target_cust = items[0]

        # Request single customer navigation
        nav_payload = {
            "customer_id": target_cust["customer_id"],
            "broker_lat": 13.6827,
            "broker_lng": 100.5478,
            "broker_location_name": "สำนักงานใหญ่ พระราม 3",
        }
        nav_res = await client.post("/api/v1/visit-planner/navigate", json=nav_payload, headers=headers)

    assert nav_res.status_code == 200
    nav_data = nav_res.json()
    assert nav_data["customer_id"] == target_cust["customer_id"]
    assert nav_data["customer_name"] == target_cust["customer_name"]
    assert nav_data["distance_km"] > 0
    assert nav_data["estimated_travel_time_minutes"] > 0
    assert "https://www.google.com/maps/dir/" in nav_data["external_maps_url"]
    assert "travelmode=driving" in nav_data["external_maps_url"]
    assert nav_data["status"] == "ready"


@pytest.mark.asyncio
async def test_navigation_endpoint_nonexistent_customer():
    """Test Phases 9-10: POST /navigate returns 404 for invalid customer ID."""
    token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    nav_payload = {
        "customer_id": "nonexistent-customer-99999",
        "broker_lat": 13.6827,
        "broker_lng": 100.5478,
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/navigate", json=nav_payload, headers=headers)

    assert res.status_code == 404


@pytest.mark.asyncio
async def test_navigation_endpoint_unauthorized_customer():
    """Test Phases 9-10: Broker cannot navigate to another broker's customer."""
    # Reassign a customer to another broker
    async with TestAsyncSession() as db:
        res = await db.execute(User.__table__.select().where(User.email == "broker1@demo.local"))
        other_broker = res.first()
        assert other_broker is not None
        await db.execute(
            Customer.__table__.update()
            .where(Customer.external_ref == "KS-00005")
            .values(assigned_broker_id=other_broker.id)
        )
        await db.commit()

        res_cust = await db.execute(Customer.__table__.select().where(Customer.external_ref == "KS-00005"))
        other_cust = res_cust.first()

    assert other_cust is not None
    broker_token = await get_auth_token("broker@demo.local", "broker")
    headers = {"Authorization": f"Bearer {broker_token}"}

    nav_payload = {
        "customer_id": other_cust.id,
        "broker_lat": 13.6827,
        "broker_lng": 100.5478,
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/visit-planner/navigate", json=nav_payload, headers=headers)
    assert res.status_code == 403





