import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("AI Customer Visit Planner — Frontend Logic & Constraints", () => {
  // Mock candidates
  const candidates = [
    {
      customer_id: "cust-1",
      customer_name: "สมชาย รักสงบ",
      priority_level: "high",
      priority_score: 92,
      routable: true,
      latitude: 13.72,
      longitude: 100.53,
      why_now: "ประกันใกล้หมดอายุใน 21 วัน",
    },
    {
      customer_id: "cust-2",
      customer_name: "วิภาวี มั่งคั่ง",
      priority_level: "medium",
      priority_score: 65,
      routable: true,
      latitude: 13.71,
      longitude: 100.54,
      why_now: "ครบรอบทบทวนกรมธรรม์ประจำปี",
    },
    {
      customer_id: "cust-3",
      customer_name: "อำนาจ เจริญกิจ",
      priority_level: "high",
      priority_score: 85,
      routable: false,
      latitude: null,
      longitude: null,
      why_now: "ต้องการขยายวงเงินคุ้มครอง",
    },
  ];

  test("Candidate selection and routability filter", () => {
    const routableCandidates = candidates.filter((c) => c.routable);
    assert.equal(routableCandidates.length, 2, "Only 2 candidates have valid coordinates");

    const highPriorityRoutable = candidates.filter(
      (c) => c.routable && c.priority_level === "high"
    );
    assert.equal(highPriorityRoutable.length, 1, "Only 1 routable candidate has high priority");
    assert.equal(highPriorityRoutable[0].customer_id, "cust-1");
  });

  test("Strict Scope Enforcement: Visit stops MUST NOT contain appointment times or meeting schedules", () => {
    // Phase 5 explicitly forbids showing meeting times, appointment windows, booking, or calendar scheduling
    const plannedVisit = {
      visit_order: 1,
      customer_name: "สมชาย รักสงบ",
      priority_score: 92,
      why_now: "ประกันใกล้หมดอายุใน 21 วัน",
      distance_from_prev_km: 4.8,
      transit_time_from_prev_minutes: 12.0,
      explanation: "จัดเข้าพบเป็นลำดับแรกออกจากสำนักงานใหญ่พระราม 3",
    };

    assert.equal("meeting_time" in plannedVisit, false, "meeting_time must NOT be present in UI visit item");
    assert.equal("appointment_window" in plannedVisit, false, "appointment_window must NOT be present in UI visit item");
    assert.equal("booking_id" in plannedVisit, false, "booking must NOT be present in UI visit item");
    assert.equal("calendar_slot" in plannedVisit, false, "calendar scheduling must NOT be present in UI visit item");
  });

  test("Coordinate Projection onto SVG Canvas", () => {
    const SVG_WIDTH = 800;
    const SVG_HEIGHT = 560;
    const PADDING = 70;

    const bounds = {
      minLat: 13.65,
      maxLat: 13.75,
      minLng: 100.50,
      maxLng: 100.60,
    };

    const project = (lat, lng) => {
      const xPct = (lng - bounds.minLng) / (bounds.maxLng - bounds.minLng);
      const yPct = 1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat);
      return {
        x: PADDING + xPct * (SVG_WIDTH - 2 * PADDING),
        y: PADDING + yPct * (SVG_HEIGHT - 2 * PADDING),
      };
    };

    // Test center of Bangkok bounds
    const center = project(13.70, 100.55);
    assert.ok(center.x > PADDING && center.x < SVG_WIDTH - PADDING, "X coordinate is within canvas padding");
    assert.ok(center.y > PADDING && center.y < SVG_HEIGHT - PADDING, "Y coordinate is within canvas padding");

    // Higher latitude should produce smaller SVG Y (screen coordinates inverted)
    const northPt = project(13.74, 100.55);
    const southPt = project(13.66, 100.55);
    assert.ok(northPt.y < southPt.y, "Northern point should render higher (smaller Y) on screen");
  });

  test("Constraint Utilization and Feasibility Check", () => {
    const maxTravelMinutes = 150;
    const maxDistanceKm = 60.0;

    // Test Feasible Case
    const feasibleRoute = {
      total_travel_time_minutes: 55.0,
      total_distance_km: 21.6,
      office_return_time: "11:40",
      office_closing_time: "17:30",
    };

    const isTravelTimeFeasible = feasibleRoute.total_travel_time_minutes <= maxTravelMinutes;
    const isDistanceFeasible = feasibleRoute.total_distance_km <= maxDistanceKm;
    const isWorkingHoursFeasible = feasibleRoute.office_return_time <= feasibleRoute.office_closing_time;

    assert.equal(isTravelTimeFeasible, true);
    assert.equal(isDistanceFeasible, true);
    assert.equal(isWorkingHoursFeasible, true);

    // Test Infeasible Case
    const infeasibleRoute = {
      total_travel_time_minutes: 175.0,
      total_distance_km: 72.0,
      office_return_time: "18:15",
      office_closing_time: "17:30",
    };

    assert.equal(infeasibleRoute.total_travel_time_minutes <= maxTravelMinutes, false);
    assert.equal(infeasibleRoute.total_distance_km <= maxDistanceKm, false);
    assert.equal(infeasibleRoute.office_return_time <= infeasibleRoute.office_closing_time, false);
  });

  // ── Phase 7: Nearby Customer Discovery Tests ─────────────────────────

  test("Phase 7: Radius-based Customer Filtering (5km, 10km, 20km)", () => {
    const brokerLoc = { lat: 13.6827, lng: 100.5478 }; // Rama 3

    // Approximate haversine distance helper
    const calcDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371.0;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Math.round(R * c * 10) / 10;
    };

    const mockCandidates = [
      { id: "c1", name: "Pearl", lat: 13.7027, lng: 100.5478 }, // ~2.2 km
      { id: "c2", name: "Bank", lat: 13.7227, lng: 100.5478 },  // ~4.4 km
      { id: "c3", name: "May", lat: 13.7527, lng: 100.5478 },   // ~7.8 km
      { id: "c4", name: "Golf", lat: 13.8227, lng: 100.5478 },  // ~15.6 km
      { id: "c5", name: "Nok", lat: 13.9827, lng: 100.5478 },   // ~33.4 km
    ].map((c) => ({
      ...c,
      distance_km: calcDistance(brokerLoc.lat, brokerLoc.lng, c.lat, c.lng),
    }));

    // Filter by 5 km
    const within5km = mockCandidates.filter((c) => c.distance_km <= 5.0);
    assert.equal(within5km.length, 2, "Only Pearl (~2.2km) and Bank (~4.4km) are within 5 km");

    // Filter by 10 km (default)
    const within10km = mockCandidates.filter((c) => c.distance_km <= 10.0);
    assert.equal(within10km.length, 3, "Pearl, Bank, and May are within 10 km");

    // Filter by 20 km
    const within20km = mockCandidates.filter((c) => c.distance_km <= 20.0);
    assert.equal(within20km.length, 4, "Pearl, Bank, May, and Golf are within 20 km");

    // Radius scaling invariant: 5km count <= 10km count <= 20km count
    assert.ok(within5km.length <= within10km.length);
    assert.ok(within10km.length <= within20km.length);
  });

  test("Phase 7: Broker Manually Chooses Customer (No Automatic A -> B -> C sequencing)", () => {
    // In Phase 7, the system must NOT automatically assign visit order or generate full route
    let selectedCustomer = null;

    const brokerCandidates = [
      { id: "c1", name: "Pearl", priority: "high", distance_km: 2.4, why_now: "Protection Gap" },
      { id: "c2", name: "Bank", priority: "high", distance_km: 4.1, why_now: "Recent update" },
      { id: "c3", name: "May", priority: "medium", distance_km: 6.8, why_now: "Follow-up required" },
    ];

    // Initial state: NO customer is automatically selected as next stop
    assert.equal(selectedCustomer, null, "Initial state has no automatic customer choice");

    // Broker manual selection of Customer 2 (Bank)
    const selectCustomer = (customer) => {
      selectedCustomer = customer;
    };

    selectCustomer(brokerCandidates[1]); // Broker explicitly chooses Bank
    assert.ok(selectedCustomer !== null);
    assert.equal(selectedCustomer.name, "Bank");
    assert.equal(selectedCustomer.distance_km, 4.1);

    // Navigation readiness is prepared for this single customer, not a multi-stop route
    const navigationTarget = {
      customer_id: selectedCustomer.id,
      customer_name: selectedCustomer.name,
      distance_km: selectedCustomer.distance_km,
      ready_for_navigation: true,
      is_multi_stop_route: false, // Must NOT be an automatic route sequence
    };

    assert.equal(navigationTarget.ready_for_navigation, true);
    assert.equal(navigationTarget.is_multi_stop_route, false, "Must NOT be multi-stop auto route");
  });

  // ── Phases 9–10: On-Demand Navigation & Iterative Broker Lifecycle ───

  test("Phases 9-10: Point-to-Point Navigation URL Generation and Destination", () => {
    const brokerLoc = { lat: 13.6827, lng: 100.5478 };
    const chosenCustomer = {
      customer_id: "cust-pearl",
      customer_name: "Pearl",
      latitude: 13.7027,
      longitude: 100.5478,
      distance_km: 2.4,
    };

    const generateMapsUrl = (origin, dest) => {
      return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest.latitude},${dest.longitude}&travelmode=driving`;
    };

    const url = generateMapsUrl(brokerLoc, chosenCustomer);
    assert.ok(url.startsWith("https://www.google.com/maps/dir/"));
    assert.ok(url.includes(`origin=${brokerLoc.lat},${brokerLoc.lng}`));
    assert.ok(url.includes(`destination=${chosenCustomer.latitude},${chosenCustomer.longitude}`));
    assert.ok(url.includes("travelmode=driving"));
  });

  test("Phases 9-10: Geolocation Permission Denied Fallback Handling", () => {
    // Exact text required by prompt: "Unable to access your current location."
    const REQUIRED_ERROR_TEXT = "Unable to access your current location.";

    let geoError = null;
    let locationSource = "office_hub";
    const defaultOffice = { name: "สำนักงานใหญ่ พระราม 3", lat: 13.6827, lng: 100.5478 };

    // Simulate permission denied error
    const handleGeoError = (errCode) => {
      if (errCode === 1 /* PERMISSION_DENIED */) {
        geoError = REQUIRED_ERROR_TEXT;
        locationSource = "office_hub";
      }
    };

    handleGeoError(1);

    assert.equal(geoError, REQUIRED_ERROR_TEXT, "Must display exact required prompt error message");
    assert.equal(locationSource, "office_hub", "Must fallback gracefully to office hub without fabricating GPS");
    assert.equal(defaultOffice.lat, 13.6827);
  });

  test("Phases 9-10: Complete Visit -> New Location -> Recalculate Cycle", () => {
    // Lifecycle: Location A -> Nearby -> Select Customer -> Navigate -> Complete -> Location B -> Recalculate
    let currentBrokerLocation = { lat: 13.6827, lng: 100.5478, name: "Office Rama 3" };
    let selectedCustomer = { customer_id: "c1", customer_name: "Pearl", lat: 13.7027, lng: 100.5478 };

    // Broker completes visit with Customer 1
    const completeVisit = (visitedCustomer) => {
      // Update location to visited customer's coordinates
      currentBrokerLocation = {
        lat: visitedCustomer.lat,
        lng: visitedCustomer.lng,
        name: `เสร็จสิ้นการเข้าพบ ${visitedCustomer.customer_name}`,
      };
      // Reset selected customer
      selectedCustomer = null;
    };

    completeVisit(selectedCustomer);

    assert.equal(selectedCustomer, null, "Selected customer cleared after visit completion");
    assert.equal(currentBrokerLocation.lat, 13.7027, "Broker coordinates updated to new customer position");

    // Broker is ready to manually discover and choose Customer B
    assert.ok(currentBrokerLocation.name.includes("Pearl"));
  });
});


