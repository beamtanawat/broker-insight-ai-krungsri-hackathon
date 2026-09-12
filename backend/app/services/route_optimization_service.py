"""
Route Optimization Engine (Phase 3).
Provides deterministic, multi-objective route optimization for the AI Customer Visit Planner.

Core Capabilities:
- Respects hard constraints: Office working hours, max daily travel time, max daily distance, start/end locations.
- Optimizes soft objectives: Customer priority, urgency / Why Now relevance, travel distance, travel duration, geographic clustering.
- Uses Great-Circle Haversine distance with Bangkok urban circuity factor (1.35x) and urban speed model (24.0 km/h).
- Deterministic weighted TSP solver: Exact Branch-and-Bound (N <= 8) and deterministic priority 2-opt (N > 8).
- Explicit feasibility reporting: Identifies violated constraints with actual vs allowed values.
- Deterministic deferral recommendations: Identifies optimal candidates to defer when infeasible without auto-deletion.
- Deterministic explainability: Generates clear, factual reasons for stop order and route decisions.
"""
from datetime import datetime
import math
from typing import Any, Dict, List, Optional, Tuple

from app.core.config import settings
from app.schemas.visit_planner import (
    CandidateCustomerOut,
    ConstraintUtilization,
    LocationPoint,
    RouteOptimizeRequest,
    RouteOptimizeResponse,
    RouteStopOut,
    SuggestedDeferral,
    ViolatedConstraint,
)

# Bangkok Urban Transit Parameters
BANGKOK_CIRCUITY_FACTOR: float = 1.35
BANGKOK_AVG_SPEED_KMH: float = 24.0
MIN_TRANSIT_MINUTES: float = 3.0

# Multi-objective balancing weight:
# Priority weight defines how many km of travel distance a broker is willing to trade
# to visit a high-priority/urgent customer earlier in the day rather than late in the day.
PRIORITY_ORDERING_WEIGHT: float = 2.0


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance in kilometers using the standard haversine formula."""
    if lat1 == lat2 and lon1 == lon2:
        return 0.0
    r = 6371.0088  # Mean Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def road_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Estimates realistic urban road driving distance with Bangkok circuity factor."""
    dist = haversine_distance(lat1, lon1, lat2, lon2) * BANGKOK_CIRCUITY_FACTOR
    return round(dist, 2)


def transit_time_minutes(dist_km: float) -> float:
    """Estimates urban transit duration in minutes with Bangkok traffic model."""
    if dist_km <= 0.05:
        return 0.0
    transit_mins = (dist_km / BANGKOK_AVG_SPEED_KMH) * 60.0
    return max(MIN_TRANSIT_MINUTES, round(transit_mins, 1))


def time_str_to_minutes(time_str: str) -> int:
    """Converts HH:MM string to minutes since midnight."""
    h, m = map(int, time_str.strip().split(":"))
    return h * 60 + m


def minutes_to_time_str(total_minutes: int) -> str:
    """Converts minutes since midnight to HH:MM string."""
    norm = int(total_minutes) % 1440
    h = norm // 60
    m = norm % 60
    return f"{h:02d}:{m:02d}"


class RouteOptimizationService:
    """Deterministic Route Optimization Engine for Krungsri Broker Visit Planner."""

    @staticmethod
    def compute_customer_importance(candidate: CandidateCustomerOut) -> float:
        """
        Computes deterministic customer importance value (typically 40.0 - 150.0)
        reusing existing AI/ML priority score, priority level, and Why Now urgency.
        """
        base_score = float(candidate.priority_score if candidate.priority_score is not None else 50)

        level_bonus = 0.0
        if candidate.priority_level == "high":
            level_bonus = 25.0
        elif candidate.priority_level == "medium":
            level_bonus = 10.0

        urgency_bonus = 0.0
        if candidate.action_state == "action":
            urgency_bonus += 15.0

        if candidate.why_now:
            w_lower = candidate.why_now.lower()
            if any(k in w_lower for k in ["ครบกำหนด", "เกินกำหนด", "ด่วน", "overdue", "expir"]):
                urgency_bonus += 10.0

        return base_score + level_bonus + urgency_bonus

    @classmethod
    def build_distance_and_time_matrices(
        cls,
        start_point: LocationPoint,
        end_point: LocationPoint,
        candidates: List[CandidateCustomerOut],
    ) -> Tuple[Dict[Tuple[int, int], float], Dict[Tuple[int, int], float]]:
        """
        Builds pairwise road distance and transit time matrices.
        Index 0 = start location
        Index 1..N = candidate customers
        Index N+1 = end location
        """
        nodes: List[Tuple[float, float]] = [(start_point.latitude, start_point.longitude)]
        for c in candidates:
            assert c.latitude is not None and c.longitude is not None
            nodes.append((c.latitude, c.longitude))
        nodes.append((end_point.latitude, end_point.longitude))

        num_nodes = len(nodes)
        d_matrix: Dict[Tuple[int, int], float] = {}
        t_matrix: Dict[Tuple[int, int], float] = {}

        for i in range(num_nodes):
            lat_i, lon_i = nodes[i]
            for j in range(num_nodes):
                if i == j:
                    d_matrix[(i, j)] = 0.0
                    t_matrix[(i, j)] = 0.0
                else:
                    lat_j, lon_j = nodes[j]
                    dist = road_distance(lat_i, lon_i, lat_j, lon_j)
                    t_time = transit_time_minutes(dist)
                    d_matrix[(i, j)] = dist
                    t_matrix[(i, j)] = t_time

        return d_matrix, t_matrix

    @classmethod
    def solve_optimal_order(
        cls,
        candidates: List[CandidateCustomerOut],
        d_matrix: Dict[Tuple[int, int], float],
        start_idx: int,
        end_idx: int,
    ) -> List[int]:
        """
        Finds the optimal permutation of customer indices (1..N) that minimizes:
        Cost(P) = Distance(P) + PriorityOrderingPenalty(P)
        using exact Branch-and-Bound (N <= 8) or deterministic 2-Opt local search (N > 8).
        Tie-breaking is strictly deterministic based on customer external references and IDs.
        """
        n = len(candidates)
        if n == 0:
            return []
        if n == 1:
            return [1]

        importances = {
            i: cls.compute_customer_importance(candidates[i - 1])
            for i in range(1, n + 1)
        }

        def compute_route_cost(path: List[int]) -> Tuple[float, float]:
            """Returns (total_cost, total_distance)."""
            dist = d_matrix[(start_idx, path[0])]
            for idx in range(len(path) - 1):
                dist += d_matrix[(path[idx], path[idx + 1])]
            dist += d_matrix[(path[-1], end_idx)]

            # Penalty for scheduling high-importance customers late in the sequence:
            # Step k (1-indexed) gets penalty proportional to (k - 1) / n * importance.
            priority_penalty = 0.0
            for k, node in enumerate(path):
                pos_weight = k / float(n)
                priority_penalty += PRIORITY_ORDERING_WEIGHT * pos_weight * (importances[node] / 100.0)

            total_cost = dist + priority_penalty
            return total_cost, dist

        # ── 1. Exact Branch-and-Bound for N <= 8 ───────────────────────
        if n <= 8:
            best_cost = float("inf")
            best_path: Optional[List[int]] = None

            # Precalculate minimum outgoing distance from each customer for lower bounding
            min_out = {
                i: min(d_matrix[(i, j)] for j in range(1, n + 2) if j != i)
                for i in range(1, n + 1)
            }

            def dfs(
                curr: int,
                mask: int,
                current_path: List[int],
                current_dist: float,
                current_penalty: float,
            ):
                nonlocal best_cost, best_path
                k = len(current_path)
                if k == n:
                    total_dist = current_dist + d_matrix[(curr, end_idx)]
                    total_cost = total_dist + current_penalty
                    # Deterministic tie-breaker on equal cost (within 1e-6)
                    is_better = total_cost < best_cost - 1e-6
                    is_equal_tie_break = (
                        abs(total_cost - best_cost) <= 1e-6
                        and best_path is not None
                        and tuple(candidates[i - 1].customer_id for i in current_path)
                        < tuple(candidates[i - 1].customer_id for i in best_path)
                    )
                    if is_better or is_equal_tie_break or best_path is None:
                        best_cost = total_cost
                        best_path = list(current_path)
                    return

                # Branch-and-bound lower bound estimate
                remaining_min_dist = sum(
                    min_out[j] for j in range(1, n + 1) if not (mask & (1 << j))
                )
                if current_dist + remaining_min_dist + current_penalty >= best_cost:
                    return

                # Explore remaining nodes sorted deterministically
                unvisited = [j for j in range(1, n + 1) if not (mask & (1 << j))]
                # Sorting heuristic: prefer closer nodes with higher importance
                unvisited.sort(
                    key=lambda j: (
                        d_matrix[(curr, j)],
                        -importances[j],
                        candidates[j - 1].customer_id,
                    )
                )

                for nxt in unvisited:
                    step_penalty = (
                        PRIORITY_ORDERING_WEIGHT
                        * (k / float(n))
                        * (importances[nxt] / 100.0)
                    )
                    dfs(
                        curr=nxt,
                        mask=mask | (1 << nxt),
                        current_path=current_path + [nxt],
                        current_dist=current_dist + d_matrix[(curr, nxt)],
                        current_penalty=current_penalty + step_penalty,
                    )

            dfs(curr=start_idx, mask=0, current_path=[], current_dist=0.0, current_penalty=0.0)
            assert best_path is not None
            return best_path

        # ── 2. Deterministic Priority 2-Opt Local Search for N > 8 ─────
        # Initial construction: Nearest-Neighbor with priority weighting
        unvisited = set(range(1, n + 1))
        curr = start_idx
        initial_path: List[int] = []
        while unvisited:
            k = len(initial_path)
            best_next = min(
                unvisited,
                key=lambda j: (
                    d_matrix[(curr, j)]
                    + PRIORITY_ORDERING_WEIGHT * (k / float(n)) * (importances[j] / 100.0),
                    -importances[j],
                    candidates[j - 1].customer_id,
                ),
            )
            initial_path.append(best_next)
            unvisited.remove(best_next)
            curr = best_next

        # 2-Opt local search refinement until convergence
        improved = True
        best_path = initial_path
        best_cost, _ = compute_route_cost(best_path)

        while improved:
            improved = False
            for i in range(n - 1):
                for j in range(i + 1, n):
                    # Reverse segment [i:j+1]
                    new_path = best_path[:i] + best_path[i : j + 1][::-1] + best_path[j + 1 :]
                    new_cost, _ = compute_route_cost(new_path)
                    if new_cost < best_cost - 1e-5:
                        best_cost = new_cost
                        best_path = new_path
                        improved = True
                        break
                if improved:
                    break

        return best_path

    @classmethod
    def evaluate_suggested_deferrals(
        cls,
        ordered_candidates: List[CandidateCustomerOut],
        d_matrix: Dict[Tuple[int, int], float],
        t_matrix: Dict[Tuple[int, int], float],
        start_idx: int,
        end_idx: int,
        meeting_duration_minutes: int,
        path_indices: List[int],
    ) -> List[SuggestedDeferral]:
        """
        Deterministically evaluates and ranks candidates for deferral when a route is infeasible.
        Computes marginal time and distance saved by omitting each candidate and balances
        against customer priority score and urgency.
        """
        deferrals: List[SuggestedDeferral] = []
        n = len(path_indices)
        if n <= 1:
            return deferrals

        for pos, node in enumerate(path_indices):
            cust = ordered_candidates[pos]
            prev_node = start_idx if pos == 0 else path_indices[pos - 1]
            next_node = end_idx if pos == n - 1 else path_indices[pos + 1]

            # Marginal distance saved by detouring around this node
            current_dist = d_matrix[(prev_node, node)] + d_matrix[(node, next_node)]
            bypass_dist = d_matrix[(prev_node, next_node)]
            dist_saved = max(0.0, round(current_dist - bypass_dist, 2))

            # Marginal transit time saved
            current_time = t_matrix[(prev_node, node)] + t_matrix[(node, next_node)]
            bypass_time = t_matrix[(prev_node, next_node)]
            time_saved_transit = max(0.0, round(current_time - bypass_time, 1))

            total_time_saved = time_saved_transit + meeting_duration_minutes
            importance = cls.compute_customer_importance(cust)

            # Deferral attractiveness score: higher time/distance saved & lower priority = better candidate to defer
            # Adding deterministic tie-breaker by customer_id
            deferral_score = (total_time_saved + (dist_saved * 1.5)) / max(1.0, importance)

            p_level = cust.priority_level or "unscored"
            p_score = cust.priority_score if cust.priority_score is not None else 50

            reason = (
                f"คะแนนความสำคัญ {p_score} ({p_level}) — การเลื่อนนัดจะช่วยประหยัดเวลาได้รวม "
                f"{total_time_saved:.0f} นาที (เดินทาง {time_saved_transit:.0f} นาที + เข้าพบ {meeting_duration_minutes} นาที) "
                f"และระยะทาง {dist_saved:.1f} กม. ช่วยให้เส้นทางกลับมาเป็นไปได้ตามเกณฑ์"
            )

            deferrals.append(
                (
                    deferral_score,
                    SuggestedDeferral(
                        customer_id=cust.customer_id,
                        external_ref=cust.external_ref,
                        customer_name=cust.customer_name,
                        priority_score=cust.priority_score,
                        priority_level=cust.priority_level,
                        marginal_time_saved_minutes=round(total_time_saved, 1),
                        marginal_distance_saved_km=dist_saved,
                        reason=reason,
                    ),
                )
            )

        # Sort descending by deferral attractiveness score
        deferrals.sort(key=lambda item: -item[0])
        return [item[1] for item in deferrals]

    @classmethod
    def generate_explanations(
        cls,
        ordered_candidates: List[CandidateCustomerOut],
        is_feasible: bool,
        violated_constraints: List[ViolatedConstraint],
        total_distance_km: float,
        total_travel_time_minutes: float,
        estimated_return_time: str,
        office_end_time: str,
    ) -> List[str]:
        """
        Generates deterministic, factual route explanations covering:
        - Customer priority placement
        - Geographic grouping and backtracking reduction
        - Urgent Why Now handling
        - Operational constraint adherence
        """
        explanations: List[str] = []

        if not ordered_candidates:
            explanations.append("ไม่มีรายการลูกค้าที่สามารถจัดเส้นทางได้")
            return explanations

        # 1. Customer Priority & Urgency Ordering Explanation
        first_cust = ordered_candidates[0]
        if first_cust.priority_level == "high" or (first_cust.priority_score and first_cust.priority_score >= 70):
            explanations.append(
                f"จัดลำดับลูกค้าความสำคัญสูง {first_cust.customer_name} ({first_cust.external_ref}, "
                f"Priority {first_cust.priority_score or 85}) เข้าพบเป็นลำดับแรกเพื่อดูแลเคสสำคัญก่อน"
            )
        elif len(ordered_candidates) > 1:
            explanations.append(
                f"จัดลำดับเริ่มจาก {first_cust.customer_name} ({first_cust.external_ref}) "
                f"ตามความคุ้มค่าด้านระยะทางและความเร่งด่วนของลูกค้า"
            )

        # 2. Urgent Why Now Explanation
        urgent_custs = [
            c for c in ordered_candidates
            if c.why_now and any(k in c.why_now for k in ["ครบกำหนด", "เกินกำหนด", "ด่วน", "ต่ออายุ"])
        ]
        if urgent_custs:
            c_urg = urgent_custs[0]
            explanations.append(
                f"จัดเข้าพบ {c_urg.customer_name} ({c_urg.external_ref}) ในเส้นทางวันนี้ เนื่องจากมีเหตุผลเร่งด่วน: {c_urg.why_now}"
            )

        # 3. Geographic Clustering & Backtracking Reduction Explanation
        districts = [c.district for c in ordered_candidates if c.district]
        unique_districts = list(dict.fromkeys(districts))
        if len(ordered_candidates) >= 2:
            if len(unique_districts) <= 2 and districts:
                dist_str = " และ ".join(unique_districts)
                explanations.append(
                    f"จัดกลุ่มลูกค้าในพื้นที่ใกล้เคียงกัน ({dist_str}) ต่อเนื่องกัน "
                    f"เพื่อลดระยะเวลาเดินทางและตัดปัญหาการเดินทางย้อนกลับ (Reduced Backtracking)"
                )
            else:
                explanations.append(
                    "จัดลำดับเส้นทางแบบวงรอบ (Loop Route) เชื่อมต่อจุดแวะอย่างมีประสิทธิภาพ "
                    "เพื่อลดระยะทางรวมและเวลาเดินทางบนท้องถนน"
                )

        # 4. Feasibility Status Explanation
        if is_feasible:
            explanations.append(
                f"เส้นทางผ่านเกณฑ์ข้อกำหนดทั้งหมด: ระยะทางรวม {total_distance_km:.1f} กม., "
                f"เวลาเดินทาง {total_travel_time_minutes:.0f} นาที, "
                f"และเดินทางกลับถึงสำนักงานเวลา {estimated_return_time} น. (ก่อนเวลาปิดทำการ {office_end_time} น.)"
            )
        else:
            violations_str = ", ".join(v.name for v in violated_constraints)
            explanations.append(
                f"เส้นทางไม่ผ่านเกณฑ์ข้อกำหนด ({violations_str}): ได้จัดเตรียมข้อเสนอแนะในการเลื่อนนัด "
                f"(Suggested Deferrals) เพื่อให้ที่ปรึกษาพิจารณาปรับแผนงานให้เป็นไปได้จริง"
            )

        return explanations

    @classmethod
    def optimize_route(
        cls,
        candidates: List[CandidateCustomerOut],
        request: RouteOptimizeRequest,
    ) -> RouteOptimizeResponse:
        """
        Main entry point for Route Optimization Engine.
        Executes full deterministic workflow:
        1. Separates routable vs unroutable candidates
        2. Configures operational parameters & office coordinates
        3. Computes distance and time matrices
        4. Solves weighted TSP with priority & urgency incentives
        5. Simulates timeline and builds detailed ordered stops
        6. Verifies hard constraints and computes utilization percentages
        7. Evaluates deferral candidates if infeasible
        8. Generates deterministic explainability
        """
        # 1. Separate routable candidates (must have valid coordinates)
        routable_candidates = [c for c in candidates if c.routable and c.latitude is not None and c.longitude is not None]
        unroutable_candidates = [c for c in candidates if not c.routable or c.latitude is None or c.longitude is None]

        # 2. Resolve operational parameters and office locations
        office_start_time = request.office_start_time or settings.VISIT_PLANNER_OFFICE_START_TIME
        office_end_time = request.office_end_time or settings.VISIT_PLANNER_OFFICE_END_TIME
        max_travel_time_minutes = (
            request.max_daily_travel_time_minutes or settings.VISIT_PLANNER_MAX_DAILY_TRAVEL_TIME_MINS
        )
        max_distance_km = (
            request.max_daily_distance_km or settings.VISIT_PLANNER_MAX_DAILY_DISTANCE_KM
        )
        meeting_duration = (
            request.meeting_duration_minutes or settings.VISIT_PLANNER_DEFAULT_MEETING_DURATION_MINS
        )

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

        office_start_min = time_str_to_minutes(office_start_time)
        office_end_min = time_str_to_minutes(office_end_time)
        working_window_minutes = max(1.0, float(office_end_min - office_start_min))

        # Handle empty routable list
        if not routable_candidates:
            empty_util = ConstraintUtilization(
                travel_time_minutes=0.0,
                travel_time_max_minutes=max_travel_time_minutes,
                travel_time_utilization_pct=0.0,
                distance_km=0.0,
                distance_max_km=max_distance_km,
                distance_utilization_pct=0.0,
                working_hours_used_minutes=0.0,
                working_hours_window_minutes=working_window_minutes,
                working_hours_utilization_pct=0.0,
                office_start_time=office_start_time,
                office_end_time=office_end_time,
                estimated_return_time=office_start_time,
            )
            return RouteOptimizeResponse(
                status="empty",
                is_feasible=True,
                summary="ไม่มีลูกค้ารายใดที่มีพิกัดพร้อมสำหรับจัดเส้นทาง (No routable customers)",
                total_stops=0,
                customer_stops_count=0,
                total_distance_km=0.0,
                total_travel_time_minutes=0.0,
                total_meeting_time_minutes=0,
                total_duration_minutes=0.0,
                office_start_time=office_start_time,
                estimated_return_time=office_start_time,
                ordered_stops=[],
                constraint_utilization=empty_util,
                violated_constraints=[],
                suggested_deferrals=[],
                explanations=["ไม่มีลูกค้ารายใดที่มีพิกัดสำหรับการจัดเส้นทาง กรุณาเลือกลูกค้าที่มีพิกัด GPS สมบูรณ์"],
                unroutable_customers=unroutable_candidates,
            )

        # 3. Build distance and time matrices
        n = len(routable_candidates)
        start_idx = 0
        end_idx = n + 1
        d_matrix, t_matrix = cls.build_distance_and_time_matrices(start_loc, end_loc, routable_candidates)

        # 4. Solve optimal customer visit sequence
        optimal_indices = cls.solve_optimal_order(routable_candidates, d_matrix, start_idx, end_idx)
        ordered_candidates = [routable_candidates[idx - 1] for idx in optimal_indices]

        # 5. Timeline simulation & build stops
        stops: List[RouteStopOut] = []
        current_clock_min = float(office_start_min)

        # Stop 0: Start Office
        stops.append(
            RouteStopOut(
                stop_order=0,
                stop_type="office_start",
                location_name=start_loc.name or "สำนักงานกรุงศรี (จุดเริ่มต้น)",
                address=start_loc.address,
                latitude=start_loc.latitude,
                longitude=start_loc.longitude,
                arrival_time=office_start_time,
                departure_time=office_start_time,
                meeting_duration_minutes=0,
                travel_time_from_prev_minutes=0.0,
                distance_from_prev_km=0.0,
                customer=None,
                stop_reason="จุดเริ่มต้นออกเดินทางประจำวัน (Depart from Office)",
            )
        )

        total_distance = 0.0
        total_travel_time = 0.0
        prev_node = start_idx

        for step_idx, node in enumerate(optimal_indices, start=1):
            cust = routable_candidates[node - 1]
            seg_dist = d_matrix[(prev_node, node)]
            seg_time = t_matrix[(prev_node, node)]

            total_distance += seg_dist
            total_travel_time += seg_time

            arrival_min = current_clock_min + seg_time
            departure_min = arrival_min + meeting_duration
            current_clock_min = departure_min

            p_level = cust.priority_level or "unscored"
            stop_reason = f"เข้าพบลูกค้าความสำคัญระดับ {p_level.upper()}"
            if cust.why_now:
                stop_reason += f" — {cust.why_now[:60]}"

            stops.append(
                RouteStopOut(
                    stop_order=step_idx,
                    stop_type="customer",
                    location_name=cust.customer_name,
                    address=cust.address,
                    latitude=cust.latitude,
                    longitude=cust.longitude,
                    arrival_time=minutes_to_time_str(int(arrival_min)),
                    departure_time=minutes_to_time_str(int(departure_min)),
                    meeting_duration_minutes=meeting_duration,
                    travel_time_from_prev_minutes=round(seg_time, 1),
                    distance_from_prev_km=round(seg_dist, 2),
                    customer=cust,
                    stop_reason=stop_reason,
                )
            )
            prev_node = node

        # Final Stop: Return to Office
        final_seg_dist = d_matrix[(prev_node, end_idx)]
        final_seg_time = t_matrix[(prev_node, end_idx)]
        total_distance += final_seg_dist
        total_travel_time += final_seg_time

        return_clock_min = current_clock_min + final_seg_time
        estimated_return_time = minutes_to_time_str(int(return_clock_min))

        stops.append(
            RouteStopOut(
                stop_order=len(stops),
                stop_type="office_end",
                location_name=end_loc.name or "สำนักงานกรุงศรี (จุดสิ้นสุด)",
                address=end_loc.address,
                latitude=end_loc.latitude,
                longitude=end_loc.longitude,
                arrival_time=estimated_return_time,
                departure_time=estimated_return_time,
                meeting_duration_minutes=0,
                travel_time_from_prev_minutes=round(final_seg_time, 1),
                distance_from_prev_km=round(final_seg_dist, 2),
                customer=None,
                stop_reason="เดินทางกลับถึงสำนักงานและสิ้นสุดภารกิจประจำวัน (Return to Office)",
            )
        )

        total_distance = round(total_distance, 2)
        total_travel_time = round(total_travel_time, 1)
        total_meeting_time = n * meeting_duration
        total_duration = round(total_travel_time + total_meeting_time, 1)

        # 6. Hard Constraint Validation
        violated_constraints: List[ViolatedConstraint] = []

        # Constraint 1: Office Hours
        if return_clock_min > office_end_min:
            over_mins = int(return_clock_min - office_end_min)
            violated_constraints.append(
                ViolatedConstraint(
                    constraint="office_hours",
                    name="เวลาเปิด-ปิดทำการ (Office Working Hours)",
                    actual=estimated_return_time,
                    allowed=office_end_time,
                    unit="time",
                    message=(
                        f"เวลาเดินทางกลับถึงสำนักงาน ({estimated_return_time} น.) เกินเวลาปิดทำการ "
                        f"({office_end_time} น.) ไป {over_mins} นาที"
                    ),
                )
            )

        # Constraint 2: Maximum Daily Travel Time
        if total_travel_time > max_travel_time_minutes:
            over_travel = round(total_travel_time - max_travel_time_minutes, 1)
            violated_constraints.append(
                ViolatedConstraint(
                    constraint="max_travel_time",
                    name="ระยะเวลาเดินทางสูงสุดต่อวัน (Max Daily Travel Time)",
                    actual=total_travel_time,
                    allowed=float(max_travel_time_minutes),
                    unit="minutes",
                    message=(
                        f"เวลาเดินทางรวม ({total_travel_time:.1f} นาที) เกินเกณฑ์สูงสุดที่กำหนด "
                        f"({max_travel_time_minutes} นาที) ไป {over_travel:.1f} นาที"
                    ),
                )
            )

        # Constraint 3: Maximum Daily Distance
        if total_distance > max_distance_km:
            over_dist = round(total_distance - max_distance_km, 2)
            violated_constraints.append(
                ViolatedConstraint(
                    constraint="max_distance",
                    name="ระยะทางเดินทางสูงสุดต่อวัน (Max Daily Distance)",
                    actual=total_distance,
                    allowed=float(max_distance_km),
                    unit="km",
                    message=(
                        f"ระยะทางเดินทางรวม ({total_distance:.1f} กม.) เกินเกณฑ์สูงสุดที่กำหนด "
                        f"({max_distance_km:.1f} กม.) ไป {over_dist:.1f} กม."
                    ),
                )
            )

        is_feasible = len(violated_constraints) == 0
        status_str = "feasible" if is_feasible else "infeasible"

        # 7. Constraint Utilization
        travel_util_pct = round((total_travel_time / max(1.0, max_travel_time_minutes)) * 100.0, 1)
        dist_util_pct = round((total_distance / max(0.1, max_distance_km)) * 100.0, 1)
        working_util_pct = round((total_duration / working_window_minutes) * 100.0, 1)

        constraint_utilization = ConstraintUtilization(
            travel_time_minutes=total_travel_time,
            travel_time_max_minutes=max_travel_time_minutes,
            travel_time_utilization_pct=travel_util_pct,
            distance_km=total_distance,
            distance_max_km=max_distance_km,
            distance_utilization_pct=dist_util_pct,
            working_hours_used_minutes=total_duration,
            working_hours_window_minutes=working_window_minutes,
            working_hours_utilization_pct=working_util_pct,
            office_start_time=office_start_time,
            office_end_time=office_end_time,
            estimated_return_time=estimated_return_time,
        )

        # 8. Suggested Deferrals when Infeasible
        suggested_deferrals: List[SuggestedDeferral] = []
        if not is_feasible:
            suggested_deferrals = cls.evaluate_suggested_deferrals(
                ordered_candidates=ordered_candidates,
                d_matrix=d_matrix,
                t_matrix=t_matrix,
                start_idx=start_idx,
                end_idx=end_idx,
                meeting_duration_minutes=meeting_duration,
                path_indices=optimal_indices,
            )

        # 9. Deterministic Explanations
        explanations = cls.generate_explanations(
            ordered_candidates=ordered_candidates,
            is_feasible=is_feasible,
            violated_constraints=violated_constraints,
            total_distance_km=total_distance,
            total_travel_time_minutes=total_travel_time,
            estimated_return_time=estimated_return_time,
            office_end_time=office_end_time,
        )

        # Summary text
        if is_feasible:
            summary = (
                f"เส้นทางผ่านเกณฑ์ข้อกำหนดสมบูรณ์ (Feasible): ทั้งหมด {n} จุดเข้าพบ "
                f"ระยะทางรวม {total_distance:.1f} กม. เวลาเดินทาง {total_travel_time:.0f} นาที "
                f"กลับถึงสำนักงานเวลา {estimated_return_time} น."
            )
        else:
            violation_names = ", ".join(v.name for v in violated_constraints)
            summary = (
                f"เส้นทางเกินเกณฑ์ข้อกำหนด ({violation_names}) (Infeasible): "
                f"มี {len(suggested_deferrals)} รายการที่แนะนำให้เลื่อนนัดเพื่อคืนสถานะความสามารถในการปฏิบัติงาน"
            )

        return RouteOptimizeResponse(
            status=status_str,
            is_feasible=is_feasible,
            summary=summary,
            total_stops=len(stops),
            customer_stops_count=n,
            total_distance_km=total_distance,
            total_travel_time_minutes=total_travel_time,
            total_meeting_time_minutes=total_meeting_time,
            total_duration_minutes=total_duration,
            office_start_time=office_start_time,
            estimated_return_time=estimated_return_time,
            ordered_stops=stops,
            constraint_utilization=constraint_utilization,
            violated_constraints=violated_constraints,
            suggested_deferrals=suggested_deferrals,
            explanations=explanations,
            unroutable_customers=unroutable_candidates,
        )


route_optimization_service = RouteOptimizationService()
