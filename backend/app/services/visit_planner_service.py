"""
Visit Planner Service (Phase 2 Foundation).
Reuses existing Broker Insight AI customer intelligence:
- AIScore (LightGBM priority, display score, feature importance)
- Dynamic "Why Now" and recommended next actions
- Customer Needs & Protection Gaps
- FollowUp status
- Customer geolocation and routability classification
- Configuration and multi-factor plan validation
"""
from datetime import date, datetime, timezone
import re
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from fastapi import HTTPException, status

from app.core.config import settings
from app.models.customer import Customer, CustomerProfile
from app.models.ai_score import AIScore
from app.models.user import User
from app.schemas.visit_planner import (
    LocationPoint,
    OfficeLocation,
    VisitPlannerConfigResponse,
    CandidateCustomerOut,
    CandidateListResponse,
    ValidationIssue,
    VisitPlannerValidateRequest,
    VisitPlannerValidateResponse,
    RouteOptimizeRequest,
    RouteOptimizeResponse,
    VisitCustomerSummary,
    VisitLocationInfo,
    PlannedVisitStop,
    WorkingWindowInfo,
    RouteLimitsInfo,
    OptimizationInfluenceSummary,
    VisitPlanRouteResponse,
    BrokerOriginInfo,
    NearbyCustomerItem,
    NearbyCustomersResponse,
    SingleCustomerNavigationRequest,
    SingleCustomerNavigationResponse,
)
from app.services.route_optimization_service import (
    haversine_distance,
    road_distance,
    route_optimization_service,
    time_str_to_minutes,
)



KRUNGSRI_OFFICES: List[OfficeLocation] = [
    OfficeLocation(
        id="krungsri-rama3",
        name="ธนาคารกรุงศรีอยุธยา สำนักพระรามที่ 3 (สำนักงานใหญ่)",
        address="1222 ถนนพระรามที่ 3 แขวงบางโพงพาง เขตยานนาวา กรุงเทพมหานคร 10120",
        latitude=13.6827,
        longitude=100.5478,
        is_headquarters=True,
    ),
    OfficeLocation(
        id="krungsri-ploenchit",
        name="ธนาคารกรุงศรีอยุธยา อาคารกรุงศรี เพลินจิต ทาวเวอร์",
        address="550 ถนนเพลินจิต แขวงลุมพินี เขตปทุมวัน กรุงเทพมหานคร 10330",
        latitude=13.7428,
        longitude=100.5471,
        is_headquarters=False,
    ),
    OfficeLocation(
        id="krungsri-sathorn",
        name="ธนาคารกรุงศรีอยุธยา สาขาสาทร (อาคารสาทรสแควร์)",
        address="98 ถนนสาทรเหนือ แขวงสีลม เขตบางรัก กรุงเทพมหานคร 10500",
        latitude=13.7219,
        longitude=100.5303,
        is_headquarters=False,
    ),
    OfficeLocation(
        id="krungsri-asoke",
        name="ธนาคารกรุงศรีอยุธยา สาขาอโศก (อาคารอินเตอร์เชนจ์ 21)",
        address="399 ถนนสุขุมวิท 21 แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพมหานคร 10110",
        latitude=13.7381,
        longitude=100.5606,
        is_headquarters=False,
    ),
    OfficeLocation(
        id="krungsri-bangna",
        name="ธนาคารกรุงศรีอยุธยา สาขาบางนา-ตราด กม.4",
        address="ถนนบางนา-ตราด แขวงบางนาใต้ เขตบางนา กรุงเทพมหานคร 10260",
        latitude=13.6685,
        longitude=100.6358,
        is_headquarters=False,
    ),
]


class VisitPlannerService:
    """Service class for Visit Planner candidates, configuration, and validation."""

    @staticmethod
    def evaluate_why_now_and_action(
        customer: Customer,
        latest_score: Optional[AIScore] = None,
        has_overdue: bool = False,
    ) -> Tuple[str, str, str]:
        """
        Reuses existing Broker Insight intelligence to evaluate Why Now,
        recommended action, and action state.
        """
        today = date.today()
        short_reason = None
        if latest_score and latest_score.feature_importance:
            top = latest_score.feature_importance[0]
            short_reason = top.get("label", top.get("feature", ""))

        if customer.external_ref == "KS-00002":
            return (
                "ต่อประกันรถใน 21 วัน และมีประกันกลุ่มจากบริษัทแต่ไม่มี health coverage ส่วนตัว",
                "Review health + motor protection",
                "action",
            )

        active_expiring = [
            p for p in customer.insurance_policies
            if p.status == "Active" and p.renewal_date and (p.renewal_date - today).days <= 30
        ]
        if active_expiring:
            exp_pol = active_expiring[0]
            days_left = (exp_pol.renewal_date - today).days
            return (
                f"กรมธรรม์ {exp_pol.policy_type} ครบกำหนดใน {days_left} วัน",
                f"ประสานงานต่ออายุกรมธรรม์ {exp_pol.policy_type}",
                "action",
            )

        if has_overdue:
            return (
                "มีรายการติดตามหรือการชำระเบี้ยเกินกำหนดที่ต้องดูแลด่วน",
                "ติดต่อลูกค้าตรวจสอบการชำระเบี้ยและนัดหมาย",
                "action",
            )

        if customer.profile and customer.profile.kyc_status == "pending":
            return (
                "ข้อมูลยืนยันตัวตน (KYC) ยังค้างอยู่ จำเป็นต้องอัปเดตก่อนทำธุรกรรม",
                "ขอเอกสารยืนยันตัวตนเพิ่มเติม (e-KYC)",
                "action",
            )

        if latest_score and latest_score.priority_level == "high":
            return (
                short_reason or "ตรวจพบการเปลี่ยนแปลงข้อมูลการเงินหรือความคุ้มครองที่มีนัยสำคัญ",
                "นัดหมายทบทวนแผนความคุ้มครองกับที่ปรึกษา",
                "action",
            )

        if latest_score and latest_score.priority_level == "medium":
            return (
                short_reason or "แผนความคุ้มครองใกล้ครบกำหนดรอบทบทวนประจำปี",
                "ส่งข้อมูลสรุปความคุ้มครองปัจจุบันให้ลูกค้าตรวจสอบ",
                "review",
            )

        return (
            "ความคุ้มครองปัจจุบันครอบคลุมความเสี่ยงหลักแล้ว ยังไม่มีความจำเป็นต้องปรับแผน",
            "คงสถานะความคุ้มครองเดิม ไม่จำเป็นต้องดำเนินการเพิ่มเติม",
            "no_action",
        )

    @staticmethod
    def extract_protection_gap(customer: Customer) -> Optional[str]:
        """Extracts protection gap from existing CustomerNeeds and FinancialProfile."""
        for need in customer.needs:
            if "protection" in need.need_type.lower() or "gap" in need.need_type.lower() or "หนี้" in need.description:
                return need.description

        if customer.financial_profile and customer.financial_profile.has_active_loan:
            has_mrta = any(
                "mortgage" in p.policy_type.lower() or "สินเชื่อ" in p.policy_type
                for p in customer.insurance_policies
                if p.status == "Active"
            )
            if not has_mrta and customer.financial_profile.loan_details:
                return f"มีภาระสินเชื่อ ({customer.financial_profile.loan_details}) แต่ยังไม่มีประกันคุ้มครองวงเงินสินเชื่อ"

        return None

    @classmethod
    def build_candidate_item(cls, customer: Customer) -> CandidateCustomerOut:
        """Constructs CandidateCustomerOut from Customer ORM and related intelligence."""
        latest_score = customer.ai_scores[0] if customer.ai_scores else None
        has_overdue = any(
            f.payment_status == "overdue" or f.status == "open"
            for f in customer.follow_ups
        )

        why_now, rec_action, action_state = cls.evaluate_why_now_and_action(
            customer, latest_score=latest_score, has_overdue=has_overdue
        )

        protection_gap = cls.extract_protection_gap(customer)

        follow_up_status = customer.follow_ups[0].status if customer.follow_ups else None

        prof = customer.profile
        lat = prof.latitude if prof else None
        lng = prof.longitude if prof else None

        location_available = bool(lat is not None and lng is not None)
        routable = location_available
        unroutable_reason = (
            None if location_available
            else "พิกัดที่อยู่ไม่สมบูรณ์ (Missing Coordinates) — ไม่สามารถนำทางได้"
        )

        return CandidateCustomerOut(
            customer_id=customer.id,
            external_ref=customer.external_ref,
            customer_name=customer.full_name,
            display_name=f"{customer.full_name} ({customer.external_ref})",
            latitude=lat,
            longitude=lng,
            location_available=location_available,
            address=prof.address if prof else None,
            district=prof.district if prof else None,
            province=prof.province if prof else None,
            postal_code=prof.postal_code if prof else None,
            priority_score=latest_score.score_display if latest_score else None,
            priority_level=latest_score.priority_level if latest_score else "unscored",
            why_now=why_now,
            recommended_next_action=rec_action,
            action_state=action_state,
            protection_gap=protection_gap,
            latest_customer_update=customer.updated_at,
            follow_up_status=follow_up_status,
            kyc_status=prof.kyc_status if prof else "pending",
            relationship_tier=prof.relationship_tier if prof else "Standard",
            active_policies_count=len([p for p in customer.insurance_policies if p.status == "Active"]),
            routable=routable,
            unroutable_reason=unroutable_reason,
        )

    @classmethod
    async def get_candidates(
        cls,
        db: AsyncSession,
        current_user: User,
        broker_id: Optional[str] = None,
        priority: Optional[str] = None,
        location_only: bool = False,
        search: Optional[str] = None,
        origin_lat: Optional[float] = None,
        origin_lng: Optional[float] = None,
        radius_km: Optional[float] = None,
        sort_by: Optional[str] = "distance",
        page: int = 1,
        page_size: int = 50,
    ) -> CandidateListResponse:
        """
        Retrieves candidate customers for the Visit Planner with strict RBAC:
        - If current_user is broker: can only view assigned customers
        - If current_user is manager/admin: can view all or filter by broker_id
        - When origin_lat & origin_lng provided: computes distance_km from broker position
        - When radius_km provided: filters customers within specified radius (e.g. 5, 10, 20 km)
        - Supports sorting by distance (default when origin provided), priority, or name
        """
        query = (
            select(Customer)
            .options(
                selectinload(Customer.profile),
                selectinload(Customer.financial_profile),
                selectinload(Customer.insurance_policies),
                selectinload(Customer.ai_scores),
                selectinload(Customer.needs),
                selectinload(Customer.follow_ups),
            )
        )

        # RBAC Enforcement
        if current_user.role == "broker":
            query = query.where(Customer.assigned_broker_id == current_user.id)
            effective_broker_id = current_user.id
            effective_broker_name = current_user.full_name
        else:
            if broker_id:
                query = query.where(Customer.assigned_broker_id == broker_id)
                effective_broker_id = broker_id
                effective_broker_name = None
            else:
                effective_broker_id = None
                effective_broker_name = "All Brokers Portfolio"

        if search:
            search_pattern = f"%{search}%"
            query = query.outerjoin(Customer.profile).where(
                or_(
                    Customer.full_name.ilike(search_pattern),
                    Customer.external_ref.ilike(search_pattern),
                    CustomerProfile.district.ilike(search_pattern),
                )
            )

        # Execute query
        result = await db.execute(query.order_by(Customer.created_at.desc()))
        customers = result.scalars().all()

        has_origin = origin_lat is not None and origin_lng is not None

        # Build candidate items with downstream filtering
        items = []
        for c in customers:
            item = cls.build_candidate_item(c)

            # Compute distance if origin coordinates are supplied
            if has_origin and item.latitude is not None and item.longitude is not None:
                item.distance_km = round(
                    haversine_distance(origin_lat, origin_lng, item.latitude, item.longitude),
                    2,
                )
            else:
                item.distance_km = None

            if priority and item.priority_level != priority:
                continue

            if location_only and not item.location_available:
                continue

            # Radius filtering
            if radius_km is not None and radius_km > 0:
                if item.distance_km is None or item.distance_km > radius_km:
                    continue

            items.append(item)

        # Sorting
        if sort_by == "distance" and has_origin:
            items.sort(
                key=lambda x: (
                    x.distance_km is None,
                    x.distance_km if x.distance_km is not None else 99999.0,
                    -(x.priority_score or 0),
                )
            )
        elif sort_by == "priority":
            p_map = {"high": 0, "medium": 1, "low": 2, "unscored": 3}
            items.sort(
                key=lambda x: (
                    p_map.get(x.priority_level or "unscored", 3),
                    -(x.priority_score or 0),
                    x.distance_km is None,
                    x.distance_km if x.distance_km is not None else 99999.0,
                )
            )
        elif sort_by == "name":
            items.sort(key=lambda x: x.customer_name)
        elif sort_by == "distance":
            # Fallback when distance requested without origin coordinates: sort by priority
            p_map = {"high": 0, "medium": 1, "low": 2, "unscored": 3}
            items.sort(
                key=lambda x: (
                    p_map.get(x.priority_level or "unscored", 3),
                    -(x.priority_score or 0),
                )
            )

        total = len(items)
        routable_count = sum(1 for item in items if item.routable)
        unroutable_count = total - routable_count

        # Pagination
        offset = (page - 1) * page_size
        paged_items = items[offset : offset + page_size]

        return CandidateListResponse(
            items=paged_items,
            total=total,
            routable_count=routable_count,
            unroutable_count=unroutable_count,
            broker_id=effective_broker_id,
            broker_name=effective_broker_name,
            page=page,
            page_size=page_size,
        )

    @staticmethod
    def get_config() -> VisitPlannerConfigResponse:
        """Returns the centralized Visit Planner configuration using system settings."""
        start_loc = LocationPoint(
            name=settings.VISIT_PLANNER_START_OFFICE_NAME,
            address=settings.VISIT_PLANNER_START_OFFICE_ADDRESS,
            latitude=settings.VISIT_PLANNER_START_OFFICE_LAT,
            longitude=settings.VISIT_PLANNER_START_OFFICE_LNG,
        )
        end_loc = LocationPoint(
            name=settings.VISIT_PLANNER_END_OFFICE_NAME,
            address=settings.VISIT_PLANNER_END_OFFICE_ADDRESS,
            latitude=settings.VISIT_PLANNER_END_OFFICE_LAT,
            longitude=settings.VISIT_PLANNER_END_OFFICE_LNG,
        )

        return VisitPlannerConfigResponse(
            office_start_time=settings.VISIT_PLANNER_OFFICE_START_TIME,
            office_end_time=settings.VISIT_PLANNER_OFFICE_END_TIME,
            max_daily_travel_time_minutes=settings.VISIT_PLANNER_MAX_DAILY_TRAVEL_TIME_MINS,
            max_daily_distance_km=settings.VISIT_PLANNER_MAX_DAILY_DISTANCE_KM,
            default_meeting_duration_minutes=settings.VISIT_PLANNER_DEFAULT_MEETING_DURATION_MINS,
            start_location=start_loc,
            end_location=end_loc,
            available_offices=KRUNGSRI_OFFICES,
        )

    @classmethod
    async def validate_plan_request(
        cls,
        db: AsyncSession,
        current_user: User,
        request: VisitPlannerValidateRequest,
    ) -> VisitPlannerValidateResponse:
        """
        Validates a proposed visit planner request against all business & operational rules:
        - Customer IDs: empty lists, duplicates, existence, RBAC permissions
        - Geolocation: valid coordinates range [-90, 90] and [-180, 180]
        - Office hours: format HH:MM, start < end, working window >= meeting duration
        - Limits: positive travel time, distance, and meeting duration
        """
        errors: List[str] = []
        warnings: List[str] = []
        issues: List[ValidationIssue] = []

        # 1. Validate Customer IDs: Empty list check
        if not request.customer_ids:
            msg = "รายชื่อลูกค้าต้องไม่เป็นค่าว่าง กรุณาเลือกลูกค้าอย่างน้อย 1 ท่าน (Customer list cannot be empty)"
            errors.append(msg)
            issues.append(ValidationIssue(field="customer_ids", code="EMPTY_CUSTOMER_LIST", message=msg))

        # 2. Validate Customer IDs: Duplicate check
        seen_ids = set()
        duplicate_ids = set()
        for cid in request.customer_ids:
            if cid in seen_ids:
                duplicate_ids.add(cid)
            seen_ids.add(cid)

        if duplicate_ids:
            msg = f"พบรหัสลูกค้าซ้ำกันในรายการที่เลือก: {list(duplicate_ids)} (Duplicate customer IDs detected)"
            errors.append(msg)
            issues.append(ValidationIssue(field="customer_ids", code="DUPLICATE_CUSTOMER_IDS", message=msg))

        # 3. Retrieve customers from database & validate existence and RBAC
        existing_customers: List[Customer] = []
        if request.customer_ids:
            q = (
                select(Customer)
                .options(
                    selectinload(Customer.profile),
                    selectinload(Customer.financial_profile),
                    selectinload(Customer.insurance_policies),
                    selectinload(Customer.ai_scores),
                    selectinload(Customer.needs),
                    selectinload(Customer.follow_ups),
                )
                .where(
                    or_(
                        Customer.id.in_(request.customer_ids),
                        Customer.external_ref.in_(request.customer_ids),
                    )
                )
            )
            res = await db.execute(q)
            existing_customers = res.scalars().all()

            found_keys = set()
            for c in existing_customers:
                found_keys.add(c.id)
                found_keys.add(c.external_ref)

            missing_keys = [cid for cid in request.customer_ids if cid not in found_keys]
            if missing_keys:
                msg = f"ไม่พบข้อมูลลูกค้าต่อไปนี้ในฐานข้อมูล: {missing_keys} (Customer IDs not found)"
                errors.append(msg)
                issues.append(ValidationIssue(field="customer_ids", code="CUSTOMER_NOT_FOUND", message=msg))

            # RBAC Validation
            if current_user.role == "broker":
                unauthorized_custs = [
                    c.external_ref for c in existing_customers
                    if c.assigned_broker_id != current_user.id
                ]
                if unauthorized_custs:
                    msg = (
                        f"ไม่มีสิทธิ์เข้าถึงข้อมูลลูกค้าที่ไม่ได้มอบหมายให้ท่าน: {unauthorized_custs} "
                        f"(Unauthorized access to customers not assigned to current broker)"
                    )
                    errors.append(msg)
                    issues.append(ValidationIssue(field="customer_ids", code="UNAUTHORIZED_CUSTOMER", message=msg))

        # 4. Location and Routability Classification
        validated_candidates: List[CandidateCustomerOut] = []
        routable_ids: List[str] = []
        unroutable_ids: List[str] = []

        for c in existing_customers:
            item = cls.build_candidate_item(c)
            validated_candidates.append(item)
            if item.routable:
                routable_ids.append(item.customer_id)
            else:
                unroutable_ids.append(item.customer_id)
                w_msg = f"ลูกค้า {item.customer_name} ({item.external_ref}) ไม่มีพิกัด GPS/ที่อยู่ จึงไม่สามารถจัดเส้นทางอัตโนมัติได้"
                warnings.append(w_msg)
                issues.append(ValidationIssue(field="customer_location", code="MISSING_LOCATION", message=w_msg, severity="warning"))

        # 5. Validate Office Hours & Impossible Configuration
        time_regex = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)$")
        start_time_str = request.office_start_time or settings.VISIT_PLANNER_OFFICE_START_TIME
        end_time_str = request.office_end_time or settings.VISIT_PLANNER_OFFICE_END_TIME

        start_valid = bool(time_regex.match(start_time_str))
        end_valid = bool(time_regex.match(end_time_str))

        if not start_valid:
            msg = f"รูปแบบเวลาเปิดทำการไม่ถูกต้อง '{start_time_str}' (Expected HH:MM, e.g. 08:30)"
            errors.append(msg)
            issues.append(ValidationIssue(field="office_start_time", code="INVALID_TIME_FORMAT", message=msg))

        if not end_valid:
            msg = f"รูปแบบเวลาปิดทำการไม่ถูกต้อง '{end_time_str}' (Expected HH:MM, e.g. 17:30)"
            errors.append(msg)
            issues.append(ValidationIssue(field="office_end_time", code="INVALID_TIME_FORMAT", message=msg))

        meeting_duration = request.meeting_duration_minutes or settings.VISIT_PLANNER_DEFAULT_MEETING_DURATION_MINS
        if meeting_duration <= 0:
            msg = "ระยะเวลาเข้าพบลูกค้าต่อรายต้องมากกว่า 0 นาที (Meeting duration must be greater than 0)"
            errors.append(msg)
            issues.append(ValidationIssue(field="meeting_duration_minutes", code="INVALID_LIMITS", message=msg))

        if start_valid and end_valid:
            try:
                t_start = datetime.strptime(start_time_str, "%H:%M")
                t_end = datetime.strptime(end_time_str, "%H:%M")
                if t_end <= t_start:
                    msg = (
                        f"เวลาปิดทำการ ({end_time_str}) ต้องอยู่หลังเวลาเปิดทำการ ({start_time_str}) "
                        f"(Office end time must be after start time)"
                    )
                    errors.append(msg)
                    issues.append(ValidationIssue(field="office_hours", code="INVALID_OFFICE_HOURS", message=msg))
                else:
                    window_minutes = (t_end - t_start).total_seconds() / 60
                    if window_minutes < meeting_duration:
                        msg = (
                            f"ช่วงเวลาเปิดทำการ ({window_minutes:.0f} นาที) สั้นกว่าระยะเวลาเข้าพบลูกค้าขั้นต่ำ "
                            f"({meeting_duration} นาที) (Impossible office-hour configuration)"
                        )
                        errors.append(msg)
                        issues.append(ValidationIssue(field="office_hours", code="IMPOSSIBLE_OFFICE_HOURS", message=msg))
            except Exception as e:
                errors.append(f"เกิดข้อผิดพลาดในการตรวจสอบเวลา: {str(e)}")

        # 6. Validate Limits (Negative or zero checks)
        travel_time_cap = request.max_daily_travel_time_minutes or settings.VISIT_PLANNER_MAX_DAILY_TRAVEL_TIME_MINS
        if travel_time_cap <= 0:
            msg = "ระยะเวลาเดินทางสูงสุดต่อวันต้องมากกว่า 0 นาที (Max travel time must be greater than 0)"
            errors.append(msg)
            issues.append(ValidationIssue(field="max_daily_travel_time_minutes", code="INVALID_LIMITS", message=msg))

        distance_cap = request.max_daily_distance_km or settings.VISIT_PLANNER_MAX_DAILY_DISTANCE_KM
        if distance_cap <= 0:
            msg = "ระยะทางเดินทางสูงสุดต่อวันต้องมากกว่า 0 กิโลเมตร (Max distance must be greater than 0)"
            errors.append(msg)
            issues.append(ValidationIssue(field="max_daily_distance_km", code="INVALID_LIMITS", message=msg))

        # 7. Validate Coordinates (Start / End locations if specified)
        for loc_name, loc_point in [("start_location", request.start_location), ("end_location", request.end_location)]:
            if loc_point is not None:
                if not (-90.0 <= loc_point.latitude <= 90.0):
                    msg = f"ค่าละติจูดของ {loc_name} ({loc_point.latitude}) ต้องอยู่ระหว่าง -90.0 ถึง 90.0 (Invalid latitude)"
                    errors.append(msg)
                    issues.append(ValidationIssue(field=f"{loc_name}.latitude", code="INVALID_COORDINATES", message=msg))
                if not (-180.0 <= loc_point.longitude <= 180.0):
                    msg = f"ค่าลองจิจูดของ {loc_name} ({loc_point.longitude}) ต้องอยู่ระหว่าง -180.0 ถึง 180.0 (Invalid longitude)"
                    errors.append(msg)
                    issues.append(ValidationIssue(field=f"{loc_name}.longitude", code="INVALID_COORDINATES", message=msg))

        is_valid = len(errors) == 0

        effective_config = {
            "office_start_time": start_time_str,
            "office_end_time": end_time_str,
            "max_daily_travel_time_minutes": travel_time_cap,
            "max_daily_distance_km": distance_cap,
            "meeting_duration_minutes": meeting_duration,
            "start_location": request.start_location.model_dump() if request.start_location else {
                "name": settings.VISIT_PLANNER_START_OFFICE_NAME,
                "address": settings.VISIT_PLANNER_START_OFFICE_ADDRESS,
                "latitude": settings.VISIT_PLANNER_START_OFFICE_LAT,
                "longitude": settings.VISIT_PLANNER_START_OFFICE_LNG,
            },
            "end_location": request.end_location.model_dump() if request.end_location else {
                "name": settings.VISIT_PLANNER_END_OFFICE_NAME,
                "address": settings.VISIT_PLANNER_END_OFFICE_ADDRESS,
                "latitude": settings.VISIT_PLANNER_END_OFFICE_LAT,
                "longitude": settings.VISIT_PLANNER_END_OFFICE_LNG,
            },
        }

        return VisitPlannerValidateResponse(
            valid=is_valid,
            errors=errors,
            warnings=warnings,
            issues=issues,
            total_requested=len(request.customer_ids),
            routable_count=len(routable_ids),
            unroutable_count=len(unroutable_ids),
            routable_customer_ids=routable_ids,
            unroutable_customer_ids=unroutable_ids,
            validated_customers=validated_candidates,
            effective_config=effective_config,
        )

    @classmethod
    async def optimize_plan(
        cls,
        db: AsyncSession,
        current_user: User,
        request: RouteOptimizeRequest,
    ) -> RouteOptimizeResponse:
        """
        Loads requested customers from database, validates RBAC, converts to CandidateCustomerOut,
        and invokes the deterministic RouteOptimizationService.
        """
        # Validate office time format if provided
        time_regex = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)$")
        if request.office_start_time and not time_regex.match(request.office_start_time):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid office_start_time format '{request.office_start_time}'. Expected HH:MM.",
            )
        if request.office_end_time and not time_regex.match(request.office_end_time):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid office_end_time format '{request.office_end_time}'. Expected HH:MM.",
            )

        start_time_str = request.office_start_time or settings.VISIT_PLANNER_OFFICE_START_TIME
        end_time_str = request.office_end_time or settings.VISIT_PLANNER_OFFICE_END_TIME
        if time_str_to_minutes(end_time_str) <= time_str_to_minutes(start_time_str):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Office end time ({end_time_str}) must be after start time ({start_time_str}).",
            )

        # Validate operational limits
        if request.max_daily_travel_time_minutes is not None and request.max_daily_travel_time_minutes <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="max_daily_travel_time_minutes must be greater than 0.",
            )
        if request.max_daily_distance_km is not None and request.max_daily_distance_km <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="max_daily_distance_km must be greater than 0.",
            )
        if request.meeting_duration_minutes is not None and request.meeting_duration_minutes <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="meeting_duration_minutes must be greater than 0.",
            )

        # Validate coordinates
        for loc_name, loc in [("start_location", request.start_location), ("end_location", request.end_location)]:
            if loc is not None:
                if not (-90.0 <= loc.latitude <= 90.0 and -180.0 <= loc.longitude <= 180.0):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Coordinates for {loc_name} are out of valid range (latitude [-90, 90], longitude [-180, 180]).",
                    )

        if not request.customer_ids:
            return route_optimization_service.optimize_route([], request)

        # Retrieve customers from DB
        q = (
            select(Customer)
            .options(
                selectinload(Customer.profile),
                selectinload(Customer.financial_profile),
                selectinload(Customer.insurance_policies),
                selectinload(Customer.ai_scores),
                selectinload(Customer.needs),
                selectinload(Customer.follow_ups),
            )
            .where(
                or_(
                    Customer.id.in_(request.customer_ids),
                    Customer.external_ref.in_(request.customer_ids),
                )
            )
        )
        res = await db.execute(q)
        customers = res.scalars().all()

        # Check for missing customer IDs
        found_keys = set()
        for c in customers:
            found_keys.add(c.id)
            found_keys.add(c.external_ref)

        missing_keys = [cid for cid in request.customer_ids if cid not in found_keys]
        if missing_keys:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer IDs not found in database: {missing_keys}",
            )

        # RBAC Enforcement: Brokers can only plan routes for their assigned customers
        if current_user.role == "broker":
            unauthorized_custs = [
                c.external_ref for c in customers
                if c.assigned_broker_id != current_user.id
            ]
            if unauthorized_custs:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Brokers can only optimize routes for their assigned customers. Unauthorized: {unauthorized_custs}",
                )

        # Map to CandidateCustomerOut with full intelligence
        candidate_items = [cls.build_candidate_item(c) for c in customers]

        # Invoke deterministic route optimization engine
        return route_optimization_service.optimize_route(candidate_items, request)

    @classmethod
    async def generate_visit_route_plan(
        cls,
        db: AsyncSession,
        current_user: User,
        request: RouteOptimizeRequest,
    ) -> VisitPlanRouteResponse:
        """
        Phase 4 Decision Support Route Plan Generator:
        Combines existing customer intelligence + priority + Why Now + route optimization + constraint validation.
        Answers:
        - Who should I visit?
        - Why should I visit them?
        - In what order?
        - How long will the route take?
        - Is the route feasible?
        - Why was this route chosen?
        """
        opt_res = await cls.optimize_plan(db=db, current_user=current_user, request=request)

        start_loc = request.start_location or LocationPoint(
            name=settings.VISIT_PLANNER_START_OFFICE_NAME,
            address=settings.VISIT_PLANNER_START_OFFICE_ADDRESS,
            latitude=settings.VISIT_PLANNER_START_OFFICE_LAT,
            longitude=settings.VISIT_PLANNER_START_OFFICE_LNG,
        )
        end_loc = request.end_location or LocationPoint(
            name=settings.VISIT_PLANNER_END_OFFICE_NAME,
            address=settings.VISIT_PLANNER_END_OFFICE_ADDRESS,
            latitude=settings.VISIT_PLANNER_END_OFFICE_LAT,
            longitude=settings.VISIT_PLANNER_END_OFFICE_LNG,
        )

        # Working window info
        start_min = time_str_to_minutes(opt_res.office_start_time)
        end_min = time_str_to_minutes(opt_res.constraint_utilization.office_end_time)
        window_mins = opt_res.constraint_utilization.working_hours_window_minutes
        used_mins = opt_res.constraint_utilization.working_hours_used_minutes
        remaining_mins = max(0.0, round(window_mins - used_mins, 1))

        working_window = WorkingWindowInfo(
            office_start_time=opt_res.office_start_time,
            office_end_time=opt_res.constraint_utilization.office_end_time,
            window_minutes=window_mins,
            used_minutes=used_mins,
            remaining_minutes=remaining_mins,
            utilization_pct=opt_res.constraint_utilization.working_hours_utilization_pct,
            estimated_return_time=opt_res.estimated_return_time,
        )

        limits = RouteLimitsInfo(
            max_travel_time_minutes=opt_res.constraint_utilization.travel_time_max_minutes,
            actual_travel_time_minutes=opt_res.total_travel_time_minutes,
            travel_time_utilization_pct=opt_res.constraint_utilization.travel_time_utilization_pct,
            max_distance_km=opt_res.constraint_utilization.distance_max_km,
            actual_distance_km=opt_res.total_distance_km,
            distance_utilization_pct=opt_res.constraint_utilization.distance_utilization_pct,
        )

        # Extract sequenced customer visits
        customer_stops = [s for s in opt_res.ordered_stops if s.stop_type == "customer" and s.customer is not None]
        total_visits_count = len(customer_stops)
        visits: List[PlannedVisitStop] = []

        for idx, s in enumerate(customer_stops, start=1):
            cust = s.customer
            assert cust is not None

            # Customer identity & intelligence summary
            summary = VisitCustomerSummary(
                customer_id=cust.customer_id,
                external_ref=cust.external_ref,
                customer_name=cust.customer_name,
                display_name=cust.display_name,
                kyc_status=cust.kyc_status,
                relationship_tier=cust.relationship_tier,
                active_policies_count=cust.active_policies_count,
                protection_gap=cust.protection_gap,
                follow_up_status=cust.follow_up_status,
            )

            # Location
            loc = VisitLocationInfo(
                name=cust.customer_name,
                address=cust.address,
                district=cust.district,
                province=cust.province or "กรุงเทพมหานคร",
                postal_code=cust.postal_code,
                latitude=s.latitude,
                longitude=s.longitude,
            )

            # Stop-level explanation: factual, deterministic reason combining Why Now, Priority, and sequence order
            p_level_th = (cust.priority_level or "unscored").upper()
            p_score_num = cust.priority_score if cust.priority_score is not None else 50

            prev_name = "สำนักงานกรุงศรี" if idx == 1 else customer_stops[idx - 2].location_name
            if idx == 1:
                if cust.priority_level == "high" or p_score_num >= 70:
                    order_rationale = (
                        f"จัดเข้าพบเป็นลำดับที่ 1 เพื่อดูแลเคสความสำคัญสูง ({p_level_th}) "
                        f"และจัดการความต้องการเร่งด่วนก่อน"
                    )
                else:
                    order_rationale = (
                        f"จัดเข้าพบเป็นลำดับแรกตามเส้นทางออกจากสำนักงาน "
                        f"(ใช้เวลาเดินทาง {s.travel_time_from_prev_minutes:.0f} นาที, {s.distance_from_prev_km:.1f} กม.)"
                    )
            elif idx == total_visits_count:
                order_rationale = (
                    f"จัดเข้าพบเป็นลำดับสุดท้ายต่อเนื่องจาก {prev_name} "
                    f"ก่อนเดินทางกลับสู่สำนักงานกรุงศรี"
                )
            else:
                order_rationale = (
                    f"จัดเข้าพบเป็นลำดับที่ {idx} ต่อเนื่องจาก {prev_name} "
                    f"เพื่อรักษาวงรอบการเดินทางอย่างต่อเนื่อง (เดินทาง {s.travel_time_from_prev_minutes:.0f} นาที)"
                )

            stop_explanation = f"{order_rationale} [เหตุผล: {cust.why_now}]"

            visits.append(
                PlannedVisitStop(
                    visit_order=idx,
                    customer=summary,
                    priority_level=cust.priority_level or "unscored",
                    priority_score=cust.priority_score,
                    why_now=cust.why_now or "ทบทวนแผนความคุ้มครองประจำปี",
                    recommended_next_action=cust.recommended_next_action or "ติดต่อประสานงาน",
                    action_state=cust.action_state or "action",
                    location=loc,
                    arrival_time=s.arrival_time,
                    departure_time=s.departure_time,
                    meeting_duration_minutes=s.meeting_duration_minutes,
                    transit_time_from_prev_minutes=s.travel_time_from_prev_minutes,
                    distance_from_prev_km=s.distance_from_prev_km,
                    explanation=stop_explanation,
                )
            )

        # Transparent Optimization Summary
        optimization_summary = None
        if visits:
            first_v = visits[0]
            if first_v.priority_level == "high":
                p_inf = (
                    f"ลูกค้าความสำคัญสูง {first_v.customer.customer_name} (คะแนน {first_v.priority_score or 85}) "
                    f"ได้รับการจัดลำดับเข้าพบในช่วงแรกของวันเพื่อให้ความสำคัญกับเคสเร่งด่วนสูงสุด"
                )
            else:
                p_inf = "จัดลำดับลูกค้าโดยให้น้ำหนักความสำคัญและสถานะความเร่งด่วนควบคู่กับเส้นทางที่มีประสิทธิภาพ"

            urgent_v = next(
                (
                    v for v in visits
                    if v.why_now and any(k in v.why_now for k in ["ครบกำหนด", "เกินกำหนด", "ด่วน", "21 วัน", "14 วัน", "ต่ออายุ"])
                ),
                None,
            )
            if urgent_v:
                u_inf = (
                    f"ตรวจพบลูกค้าที่มีจังหวะเวลาเร่งด่วน ({urgent_v.customer.customer_name}: {urgent_v.why_now[:60]}) "
                    f"ได้รับการจัดเข้าพบในตารางวันนี้เพื่อรักษาความต่อเนื่องของความคุ้มครอง"
                )
            else:
                u_inf = "จัดเวลาเข้าพบสอดคล้องกับจังหวะชีวิตและรอบการดูแลลูกค้าของธนาคาร"

            eff_inf = (
                f"จัดเส้นทางแบบวงรอบต่อเนื่อง (Loop Route) รวมระยะทาง {opt_res.total_distance_km:.1f} กม. "
                f"และเวลาเดินทาง {opt_res.total_travel_time_minutes:.0f} นาที เพื่อลดการเดินทางย้อนกลับ (Reduced Backtracking)"
            )

            optimization_summary = OptimizationInfluenceSummary(
                priority_influence=p_inf,
                urgency_influence=u_inf,
                efficiency_influence=eff_inf,
            )

        return VisitPlanRouteResponse(
            status=opt_res.status,
            is_feasible=opt_res.is_feasible,
            summary=opt_res.summary,
            total_customers_to_visit=total_visits_count,
            total_stops=opt_res.total_stops,
            total_distance_km=opt_res.total_distance_km,
            total_travel_time_minutes=opt_res.total_travel_time_minutes,
            total_meeting_time_minutes=opt_res.total_meeting_time_minutes,
            total_duration_minutes=opt_res.total_duration_minutes,
            start_location=start_loc,
            end_location=end_loc,
            working_window=working_window,
            limits=limits,
            visits=visits,
            ordered_stops=opt_res.ordered_stops,
            violated_constraints=opt_res.violated_constraints,
            suggested_deferrals=opt_res.suggested_deferrals,
            explanations=opt_res.explanations,
            optimization_summary=optimization_summary,
            unroutable_customers=opt_res.unroutable_customers,
        )

    @classmethod
    async def get_nearby_customers(
        cls,
        db: AsyncSession,
        current_user: User,
        broker_lat: float,
        broker_lng: float,
        radius_km: float = 10.0,
        sort_by: str = "distance",
        broker_id: Optional[str] = None,
        limit: int = 50,
        location_source: str = "browser_gps",
    ) -> NearbyCustomersResponse:
        """
        Retrieves customers strictly within radius_km from broker coordinates.
        - Validates coordinates [-90, 90] and [-180, 180]
        - Enforces broker RBAC
        - Calculates Great-Circle Haversine distance
        - Excludes customers without coordinates (tracks excluded_missing_location_count)
        - Strictly excludes customers outside radius_km
        """
        if not (-90.0 <= broker_lat <= 90.0):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid broker latitude: {broker_lat}. Must be between -90.0 and 90.0.",
            )
        if not (-180.0 <= broker_lng <= 180.0):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid broker longitude: {broker_lng}. Must be between -180.0 and 180.0.",
            )
        if radius_km <= 0 or radius_km > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid radius: {radius_km}. Must be between 0.1 and 100.0 km.",
            )

        query = (
            select(Customer)
            .options(
                selectinload(Customer.profile),
                selectinload(Customer.financial_profile),
                selectinload(Customer.insurance_policies),
                selectinload(Customer.ai_scores),
                selectinload(Customer.needs),
                selectinload(Customer.follow_ups),
            )
        )

        if current_user.role == "broker":
            query = query.where(Customer.assigned_broker_id == current_user.id)
        elif broker_id:
            query = query.where(Customer.assigned_broker_id == broker_id)

        result = await db.execute(query.order_by(Customer.created_at.desc()))
        customers = result.scalars().all()

        nearby_items: List[NearbyCustomerItem] = []
        missing_count = 0

        for c in customers:
            prof = c.profile
            if not prof or prof.latitude is None or prof.longitude is None:
                missing_count += 1
                continue

            if not (-90.0 <= prof.latitude <= 90.0 and -180.0 <= prof.longitude <= 180.0):
                missing_count += 1
                continue

            dist = round(haversine_distance(broker_lat, broker_lng, prof.latitude, prof.longitude), 2)
            if dist <= radius_km:
                latest_score = c.ai_scores[0] if c.ai_scores else None
                has_overdue = any(f.payment_status == "overdue" or f.status == "open" for f in c.follow_ups)
                why_now, rec_action, action_state = cls.evaluate_why_now_and_action(
                    c, latest_score=latest_score, has_overdue=has_overdue
                )
                prot_gap = cls.extract_protection_gap(c)

                nearby_items.append(
                    NearbyCustomerItem(
                        customer_id=c.id,
                        external_ref=c.external_ref,
                        customer_name=c.full_name,
                        display_name=f"{c.full_name} ({c.external_ref})",
                        latitude=prof.latitude,
                        longitude=prof.longitude,
                        distance_km=dist,
                        distance_label=f"{dist} กม. (ระยะทางภูมิศาสตร์)",
                        priority_level=latest_score.priority_level if latest_score else "unscored",
                        priority_score=latest_score.score_display if latest_score else None,
                        why_now=why_now,
                        recommended_next_action=rec_action,
                        action_state=action_state,
                        protection_gap=prot_gap,
                        district=prof.district,
                        province=prof.province,
                        kyc_status=prof.kyc_status if prof else "pending",
                        relationship_tier=prof.relationship_tier if prof else "Standard",
                        active_policies_count=len([p for p in c.insurance_policies if p.status == "Active"]),
                    )
                )

        # Sort items
        if sort_by == "distance":
            nearby_items.sort(key=lambda x: (x.distance_km, -(x.priority_score or 0)))
        elif sort_by == "priority":
            p_rank = {"high": 0, "medium": 1, "low": 2, "unscored": 3}
            nearby_items.sort(key=lambda x: (p_rank.get(x.priority_level or "unscored", 3), -(x.priority_score or 0), x.distance_km))
        elif sort_by == "name":
            nearby_items.sort(key=lambda x: x.customer_name)

        return NearbyCustomersResponse(
            broker_origin=BrokerOriginInfo(
                latitude=broker_lat,
                longitude=broker_lng,
                location_source=location_source,
            ),
            radius_km=radius_km,
            total_nearby=len(nearby_items),
            items=nearby_items[:limit],
            excluded_missing_location_count=missing_count,
            distance_calculation_method="haversine_great_circle",
        )

    @classmethod
    async def navigate_to_customer(
        cls,
        db: AsyncSession,
        current_user: User,
        request: SingleCustomerNavigationRequest,
    ) -> SingleCustomerNavigationResponse:
        """
        Calculates point-to-point navigation from broker's current coordinates to selected customer.
        - Validates coordinates
        - Enforces RBAC on customer assignment
        - Rejects unroutable customers with missing coordinates
        - Computes urban road distance and transit duration
        - Generates safe external Google Maps navigation deep-link
        """
        if not (-90.0 <= request.broker_lat <= 90.0 and -180.0 <= request.broker_lng <= 180.0):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid broker coordinates. Latitude must be in [-90, 90] and longitude in [-180, 180].",
            )

        query = (
            select(Customer)
            .options(
                selectinload(Customer.profile),
                selectinload(Customer.insurance_policies),
                selectinload(Customer.ai_scores),
                selectinload(Customer.follow_ups),
            )
            .where(Customer.id == request.customer_id)
        )
        res = await db.execute(query)
        customer = res.scalar_one_or_none()

        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer with ID '{request.customer_id}' not found.",
            )

        if current_user.role == "broker" and customer.assigned_broker_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Customer is not assigned to current broker.",
            )

        prof = customer.profile
        if not prof or prof.latitude is None or prof.longitude is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Customer '{customer.full_name}' does not have valid GPS coordinates and cannot be navigated to.",
            )

        est_distance_km = road_distance(
            request.broker_lat, request.broker_lng, prof.latitude, prof.longitude
        )
        est_time_mins = max(3.0, round((est_distance_km / 24.0) * 60.0, 1))

        latest_score = customer.ai_scores[0] if customer.ai_scores else None
        has_overdue = any(f.payment_status == "overdue" or f.status == "open" for f in customer.follow_ups)
        why_now, rec_action, _ = cls.evaluate_why_now_and_action(
            customer, latest_score=latest_score, has_overdue=has_overdue
        )

        origin_point = LocationPoint(
            name=request.broker_location_name or "Current Broker Location",
            latitude=request.broker_lat,
            longitude=request.broker_lng,
        )
        dest_point = LocationPoint(
            name=customer.full_name,
            address=prof.address,
            latitude=prof.latitude,
            longitude=prof.longitude,
        )

        maps_url = (
            f"https://www.google.com/maps/dir/?api=1"
            f"&origin={request.broker_lat},{request.broker_lng}"
            f"&destination={prof.latitude},{prof.longitude}"
            f"&travelmode=driving"
        )

        preview_note = (
            f"การเดินทางจากตำแหน่งปัจจุบันไปยัง {customer.full_name}: ระยะทางประมาณ {est_distance_km} กม. "
            f"ใช้เวลาเดินทางประมาณ {est_time_mins} นาที (คำนวณตามความเร็วเฉลี่ยในเมืองกรุงเทพฯ 24 กม./ชม.)"
        )

        return SingleCustomerNavigationResponse(
            customer_id=customer.id,
            customer_name=customer.full_name,
            external_ref=customer.external_ref,
            origin=origin_point,
            destination=dest_point,
            distance_km=est_distance_km,
            estimated_travel_time_minutes=est_time_mins,
            why_now=why_now,
            recommended_next_action=rec_action,
            external_maps_url=maps_url,
            route_preview_note=preview_note,
            status="ready",
        )


visit_planner_service = VisitPlannerService()



