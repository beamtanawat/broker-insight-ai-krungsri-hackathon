"""Pydantic schemas for Visit Planner endpoints."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class LocationPoint(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    latitude: float
    longitude: float


class OfficeLocation(BaseModel):
    id: str
    name: str
    address: str
    latitude: float
    longitude: float
    is_headquarters: bool = False


class VisitPlannerConfigResponse(BaseModel):
    office_start_time: str
    office_end_time: str
    max_daily_travel_time_minutes: int
    max_daily_distance_km: float
    default_meeting_duration_minutes: int
    start_location: LocationPoint
    end_location: LocationPoint
    available_offices: List[OfficeLocation]


class CandidateCustomerOut(BaseModel):
    customer_id: str
    external_ref: str
    customer_name: str
    display_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distance_km: Optional[float] = None
    location_available: bool
    address: Optional[str] = None
    district: Optional[str] = None
    province: Optional[str] = None
    postal_code: Optional[str] = None
    priority_score: Optional[int] = None
    priority_level: Optional[str] = None
    why_now: Optional[str] = None
    recommended_next_action: Optional[str] = None
    action_state: Optional[str] = "action"
    protection_gap: Optional[str] = None
    latest_customer_update: Optional[datetime] = None
    follow_up_status: Optional[str] = None
    kyc_status: str
    relationship_tier: Optional[str] = "Standard"
    active_policies_count: int = 0
    routable: bool
    unroutable_reason: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CandidateListResponse(BaseModel):
    items: List[CandidateCustomerOut]
    total: int
    routable_count: int
    unroutable_count: int
    broker_id: Optional[str] = None
    broker_name: Optional[str] = None
    page: int = 1
    page_size: int = 50


class ValidationIssue(BaseModel):
    field: str
    code: str
    message: str
    severity: str = "error"  # "error" | "warning"


class VisitPlannerValidateRequest(BaseModel):
    customer_ids: List[str]
    office_start_time: Optional[str] = None
    office_end_time: Optional[str] = None
    max_daily_travel_time_minutes: Optional[int] = None
    max_daily_distance_km: Optional[float] = None
    start_location: Optional[LocationPoint] = None
    end_location: Optional[LocationPoint] = None
    meeting_duration_minutes: Optional[int] = None


class VisitPlannerValidateResponse(BaseModel):
    valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    issues: List[ValidationIssue] = Field(default_factory=list)
    total_requested: int = 0
    routable_count: int = 0
    unroutable_count: int = 0
    routable_customer_ids: List[str] = Field(default_factory=list)
    unroutable_customer_ids: List[str] = Field(default_factory=list)
    validated_customers: List[CandidateCustomerOut] = Field(default_factory=list)
    effective_config: Dict[str, Any] = Field(default_factory=dict)


class ViolatedConstraint(BaseModel):
    constraint: str  # "office_hours" | "max_travel_time" | "max_distance"
    name: str        # e.g. "เวลาเปิด-ปิดทำการ (Office Hours)"
    actual: Any      # actual value: e.g. 175.5 or "18:20"
    allowed: Any     # allowed value: e.g. 150.0 or "17:30"
    unit: str        # "minutes" | "km" | "time"
    message: str


class SuggestedDeferral(BaseModel):
    customer_id: str
    external_ref: str
    customer_name: str
    priority_score: Optional[int] = None
    priority_level: Optional[str] = None
    marginal_time_saved_minutes: float
    marginal_distance_saved_km: float
    reason: str


class ConstraintUtilization(BaseModel):
    travel_time_minutes: float
    travel_time_max_minutes: int
    travel_time_utilization_pct: float
    distance_km: float
    distance_max_km: float
    distance_utilization_pct: float
    working_hours_used_minutes: float
    working_hours_window_minutes: float
    working_hours_utilization_pct: float
    office_start_time: str
    office_end_time: str
    estimated_return_time: str


class RouteStopOut(BaseModel):
    stop_order: int
    stop_type: str  # "office_start" | "customer" | "office_end"
    location_name: str
    address: Optional[str] = None
    latitude: float
    longitude: float
    arrival_time: str
    departure_time: str
    meeting_duration_minutes: int
    travel_time_from_prev_minutes: float
    distance_from_prev_km: float
    customer: Optional[CandidateCustomerOut] = None
    stop_reason: Optional[str] = None


class RouteOptimizeRequest(BaseModel):
    customer_ids: List[str]
    office_start_time: Optional[str] = None
    office_end_time: Optional[str] = None
    max_daily_travel_time_minutes: Optional[int] = None
    max_daily_distance_km: Optional[float] = None
    meeting_duration_minutes: Optional[int] = None
    start_location: Optional[LocationPoint] = None
    end_location: Optional[LocationPoint] = None


class RouteOptimizeResponse(BaseModel):
    status: str  # "feasible" | "infeasible" | "empty"
    is_feasible: bool
    summary: str
    total_stops: int
    customer_stops_count: int
    total_distance_km: float
    total_travel_time_minutes: float
    total_meeting_time_minutes: int
    total_duration_minutes: float
    office_start_time: str
    estimated_return_time: str
    ordered_stops: List[RouteStopOut]
    constraint_utilization: ConstraintUtilization
    violated_constraints: List[ViolatedConstraint] = Field(default_factory=list)
    suggested_deferrals: List[SuggestedDeferral] = Field(default_factory=list)
    explanations: List[str] = Field(default_factory=list)
    unroutable_customers: List[CandidateCustomerOut] = Field(default_factory=list)


# ── Phase 4: Decision Support API Schemas ─────────────────────────────

class VisitCustomerSummary(BaseModel):
    customer_id: str
    external_ref: str
    customer_name: str
    display_name: str
    kyc_status: str
    relationship_tier: Optional[str] = "Standard"
    active_policies_count: int = 0
    protection_gap: Optional[str] = None
    follow_up_status: Optional[str] = None


class VisitLocationInfo(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = None
    province: Optional[str] = "กรุงเทพมหานคร"
    postal_code: Optional[str] = None
    latitude: float
    longitude: float


class PlannedVisitStop(BaseModel):
    visit_order: int                       # 1-indexed customer visit order
    customer: VisitCustomerSummary         # Customer intelligence identity
    priority_level: str                    # "high" | "medium" | "low" | "unscored"
    priority_score: Optional[int] = None   # LightGBM display score (0-100)
    why_now: str                           # Reused existing intelligence Why Now
    recommended_next_action: str           # Reused existing recommended action
    action_state: str                      # "action" | "review" | "no_action"
    location: VisitLocationInfo            # Address & coordinates
    arrival_time: str                      # HH:MM
    departure_time: str                    # HH:MM
    meeting_duration_minutes: int          # Minutes
    transit_time_from_prev_minutes: float  # Minutes from previous location
    distance_from_prev_km: float           # Km from previous location
    explanation: str                       # Stop-level deterministic rationale


class WorkingWindowInfo(BaseModel):
    office_start_time: str
    office_end_time: str
    window_minutes: float
    used_minutes: float
    remaining_minutes: float
    utilization_pct: float
    estimated_return_time: str


class RouteLimitsInfo(BaseModel):
    max_travel_time_minutes: int
    actual_travel_time_minutes: float
    travel_time_utilization_pct: float
    max_distance_km: float
    actual_distance_km: float
    distance_utilization_pct: float


class OptimizationInfluenceSummary(BaseModel):
    priority_influence: str      # How customer priorities shaped the sequence
    urgency_influence: str       # How Why Now urgency shaped timing
    efficiency_influence: str    # How geographic clustering and loop routing reduced travel


class VisitPlanRouteResponse(BaseModel):
    # Status & Feasibility
    status: str                            # "feasible" | "infeasible" | "empty"
    is_feasible: bool
    summary: str
    total_customers_to_visit: int
    total_stops: int                       # Including depot start and return stops
    total_distance_km: float
    total_travel_time_minutes: float
    total_meeting_time_minutes: int
    total_duration_minutes: float

    # Locations
    start_location: LocationPoint
    end_location: LocationPoint

    # Operational Windows & Constraints
    working_window: WorkingWindowInfo
    limits: RouteLimitsInfo

    # Sequenced Visits & Stops
    visits: List[PlannedVisitStop]
    ordered_stops: List[RouteStopOut]

    # Feasibility Violations & Deferrals
    violated_constraints: List[ViolatedConstraint] = Field(default_factory=list)
    suggested_deferrals: List[SuggestedDeferral] = Field(default_factory=list)

    # Explainability & Influences
    explanations: List[str] = Field(default_factory=list)
    optimization_summary: Optional[OptimizationInfluenceSummary] = None

    # Unroutable Candidates
    unroutable_customers: List[CandidateCustomerOut] = Field(default_factory=list)


# ── Phases 8–10: Nearby Discovery & On-Demand Navigation Schemas ──────

class BrokerOriginInfo(BaseModel):
    latitude: float
    longitude: float
    address: Optional[str] = None
    location_source: str = "browser_gps"  # "browser_gps" | "office_hub" | "manual"


class NearbyCustomerItem(BaseModel):
    customer_id: str
    external_ref: str
    customer_name: str
    display_name: str
    latitude: float
    longitude: float
    distance_km: float
    distance_label: str
    priority_level: Optional[str] = None
    priority_score: Optional[int] = None
    why_now: Optional[str] = None
    recommended_next_action: Optional[str] = None
    action_state: Optional[str] = "action"
    protection_gap: Optional[str] = None
    district: Optional[str] = None
    province: Optional[str] = None
    kyc_status: str
    relationship_tier: Optional[str] = "Standard"
    active_policies_count: int = 0


class NearbyCustomersResponse(BaseModel):
    broker_origin: BrokerOriginInfo
    radius_km: float
    total_nearby: int
    items: List[NearbyCustomerItem]
    excluded_missing_location_count: int
    distance_calculation_method: str = "haversine_great_circle"


class SingleCustomerNavigationRequest(BaseModel):
    customer_id: str
    broker_lat: float
    broker_lng: float
    broker_location_name: Optional[str] = "Current Broker Location"


class SingleCustomerNavigationResponse(BaseModel):
    customer_id: str
    customer_name: str
    external_ref: str
    origin: LocationPoint
    destination: LocationPoint
    distance_km: float
    estimated_travel_time_minutes: float
    why_now: Optional[str] = None
    recommended_next_action: Optional[str] = None
    external_maps_url: str
    route_preview_note: str
    status: str = "ready"



