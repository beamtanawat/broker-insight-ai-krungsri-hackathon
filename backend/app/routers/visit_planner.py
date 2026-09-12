"""
Visit Planner router (Phase 2 Foundation).
Provides endpoints for:
- GET /candidates: Retrieve candidate customers with priority, "Why Now", actions, and location flags
- GET /config: Retrieve system and office constraints configuration
- POST /validate: Multi-factor validation of proposed plan constraints and candidates
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.audit import log_audit_event
from app.models.user import User
from app.schemas.visit_planner import (
    CandidateListResponse,
    VisitPlannerConfigResponse,
    VisitPlannerValidateRequest,
    VisitPlannerValidateResponse,
    RouteOptimizeRequest,
    RouteOptimizeResponse,
    VisitPlanRouteResponse,
    NearbyCustomersResponse,
    SingleCustomerNavigationRequest,
    SingleCustomerNavigationResponse,
)
from app.services.visit_planner_service import visit_planner_service


router = APIRouter()



@router.get("/candidates", response_model=CandidateListResponse)
async def get_visit_planner_candidates(
    priority: Optional[str] = Query(None, description="Filter by priority level: high, medium, low"),
    location_only: bool = Query(False, description="Filter to only customers with valid GPS coordinates"),
    search: Optional[str] = Query(None, description="Search by customer name, ref, or district"),
    origin_lat: Optional[float] = Query(None, description="Broker current latitude for proximity calculation"),
    origin_lng: Optional[float] = Query(None, description="Broker current longitude for proximity calculation"),
    radius_km: Optional[float] = Query(None, description="Radius in km for nearby customer discovery (e.g. 5, 10, 20)"),
    sort_by: Optional[str] = Query("distance", description="Sort by: distance, priority, or name"),
    broker_id: Optional[str] = Query(None, description="Filter by assigned broker (managers/admins only)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=500, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve candidate customers for visit planning with full Broker Insight intelligence:
    - Reuses ML priority score & level
    - Reuses Why Now and recommended action triggers
    - Computes distance from broker location and filters by radius
    - Exposes location coordinates and routability status
    - Enforces strict RBAC (brokers only access assigned customers)
    """
    if current_user.role == "broker" and broker_id and broker_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brokers can only access their own assigned customers.",
        )

    candidates_response = await visit_planner_service.get_candidates(
        db=db,
        current_user=current_user,
        broker_id=broker_id,
        priority=priority,
        location_only=location_only,
        search=search,
        origin_lat=origin_lat,
        origin_lng=origin_lng,
        radius_km=radius_km,
        sort_by=sort_by,
        page=page,
        page_size=page_size,
    )

    # Log audit event for compliance
    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="VISIT_PLANNER_CANDIDATES_VIEWED",
        entity_type="VISIT_PLANNER",
        entity_id=current_user.id,
        metadata={
            "total_candidates": candidates_response.total,
            "routable_count": candidates_response.routable_count,
            "unroutable_count": candidates_response.unroutable_count,
            "priority_filter": priority,
        },
    )

    return candidates_response


@router.get("/config", response_model=VisitPlannerConfigResponse)
async def get_visit_planner_config(
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve default system office working hours, maximum travel limits,
    start/end office coordinates, and available Krungsri branch hubs.
    """
    return visit_planner_service.get_config()


@router.post("/validate", response_model=VisitPlannerValidateResponse)
async def validate_visit_plan(
    request: VisitPlannerValidateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Validate proposed visit planner inputs against operational and business rules:
    - Validates customer IDs, existence, and broker assignment (RBAC)
    - Validates coordinates and identifies unroutable customers (missing GPS)
    - Validates office hours (format, chronological order, meeting time feasibility)
    - Validates positive operational limits (travel time, distance, duration)
    """
    validation_res = await visit_planner_service.validate_plan_request(
        db=db,
        current_user=current_user,
        request=request,
    )

    # Audit validation event
    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="VISIT_PLANNER_VALIDATED",
        entity_type="VISIT_PLANNER",
        entity_id=current_user.id,
        metadata={
            "valid": validation_res.valid,
            "total_requested": validation_res.total_requested,
            "routable_count": validation_res.routable_count,
            "error_count": len(validation_res.errors),
        },
    )

    return validation_res


@router.post("/optimize", response_model=RouteOptimizeResponse)
async def optimize_visit_route(
    request: RouteOptimizeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Deterministically optimize customer visit sequence for selected customers:
    - Minimizes total travel distance and transit duration
    - Prioritizes high-priority and urgent Why Now customers earlier in the day
    - Respects office working hours, max daily travel time, max distance, and office locations
    - Returns detailed timeline stops, constraint utilization, and deterministic explanations
    - If infeasible, explicitly reports violated constraints and identifies candidate deferrals
    """
    response = await visit_planner_service.optimize_plan(
        db=db,
        current_user=current_user,
        request=request,
    )

    # Audit route optimization event
    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="VISIT_PLANNER_ROUTE_OPTIMIZED",
        entity_type="VISIT_PLANNER",
        entity_id=current_user.id,
        metadata={
            "customer_count": response.customer_stops_count,
            "status": response.status,
            "is_feasible": response.is_feasible,
            "total_distance_km": response.total_distance_km,
            "total_travel_time_minutes": response.total_travel_time_minutes,
            "violated_constraints_count": len(response.violated_constraints),
        },
    )

    return response


@router.post("/route", response_model=VisitPlanRouteResponse)
async def plan_visit_route_decision_support(
    request: RouteOptimizeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Phase 4 Broker Decision Support Route Endpoint:
    Integrates existing Customer Intelligence + Priority + Why Now + Route Optimization + Constraints.
    Answers:
    - Who should I visit? (visits with customer summary, tier, needs)
    - Why should I visit them? (priority, display score, Why Now, recommended next action)
    - In what order? (visit_order, arrival/departure timeline)
    - How long will the route take? (total travel time, meeting time, working window utilization)
    - Is the route feasible? (status, is_feasible, violated constraints)
    - Why was this route chosen? (deterministic stop and route explanations, optimization influence summary)
    """
    plan = await visit_planner_service.generate_visit_route_plan(
        db=db,
        current_user=current_user,
        request=request,
    )

    # Log audit event for decision support route generation
    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="VISIT_PLANNER_DECISION_SUPPORT_GENERATED",
        entity_type="VISIT_PLANNER",
        entity_id=current_user.id,
        metadata={
            "total_customers": plan.total_customers_to_visit,
            "status": plan.status,
            "is_feasible": plan.is_feasible,
            "total_distance_km": plan.total_distance_km,
            "total_travel_time_minutes": plan.total_travel_time_minutes,
            "violated_constraints_count": len(plan.violated_constraints),
        },
    )

    return plan


# ── Phases 8–10: Nearby Customer Discovery & On-Demand Navigation ──────

@router.get("/nearby-customers", response_model=NearbyCustomersResponse)
async def get_nearby_customers(
    broker_lat: float = Query(..., ge=-90.0, le=90.0, description="Broker current latitude"),
    broker_lng: float = Query(..., ge=-180.0, le=180.0, description="Broker current longitude"),
    radius_km: float = Query(10.0, ge=0.1, le=100.0, description="Discovery radius in km (default: 10 km)"),
    sort_by: str = Query("distance", pattern="^(distance|priority|name)$", description="Sort criteria: distance, priority, name"),
    broker_id: Optional[str] = Query(None, description="Filter by assigned broker (managers/admins only)"),
    limit: int = Query(50, ge=1, le=200, description="Maximum nearby customers to return"),
    location_source: str = Query("browser_gps", description="Source of broker location: browser_gps, office_hub, or manual"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Nearby Customer Discovery Endpoint (Phases 8-10):
    - Determines where the broker currently is (from browser GPS or fallback office)
    - Finds customers located strictly within the configurable radius (default: 10 km)
    - Calculates consistent Haversine distance without fabrication
    - Excludes customers with missing coordinates and tracks count
    - Enforces strict RBAC (brokers only access assigned customers)
    """
    if current_user.role == "broker" and broker_id and broker_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brokers can only access their own assigned customers.",
        )

    nearby_response = await visit_planner_service.get_nearby_customers(
        db=db,
        current_user=current_user,
        broker_lat=broker_lat,
        broker_lng=broker_lng,
        radius_km=radius_km,
        sort_by=sort_by,
        broker_id=broker_id,
        limit=limit,
        location_source=location_source,
    )

    # Log audit event for compliance
    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="VISIT_PLANNER_NEARBY_CUSTOMERS_DISCOVERED",
        entity_type="VISIT_PLANNER",
        entity_id=current_user.id,
        metadata={
            "broker_lat": broker_lat,
            "broker_lng": broker_lng,
            "radius_km": radius_km,
            "total_nearby": nearby_response.total_nearby,
            "excluded_missing_location_count": nearby_response.excluded_missing_location_count,
            "location_source": location_source,
        },
    )

    return nearby_response


@router.post("/navigate", response_model=SingleCustomerNavigationResponse)
async def navigate_to_single_customer(
    request: SingleCustomerNavigationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    On-Demand Navigation Endpoint (Phases 9-10):
    - Activates only after broker manually chooses ONE customer
    - Generates point-to-point route from Current Broker Location -> Selected Customer
    - Computes estimated distance and travel time
    - Generates safe external Google Maps navigation link
    - Validates customer coordinates and RBAC authorization
    """
    nav_response = await visit_planner_service.navigate_to_customer(
        db=db,
        current_user=current_user,
        request=request,
    )

    # Log audit event for navigation initiation
    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="VISIT_PLANNER_CUSTOMER_NAVIGATION_STARTED",
        entity_type="VISIT_PLANNER",
        entity_id=request.customer_id,
        metadata={
            "customer_id": request.customer_id,
            "customer_name": nav_response.customer_name,
            "broker_lat": request.broker_lat,
            "broker_lng": request.broker_lng,
            "distance_km": nav_response.distance_km,
            "estimated_travel_time_minutes": nav_response.estimated_travel_time_minutes,
        },
    )

    return nav_response



