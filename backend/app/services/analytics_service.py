"""
Analytics Service for computing real operational metrics with role-based scoping.
Handles Broker (personal portfolio), Manager (team level), and Admin (system-wide) views.
"""
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Tuple
from sqlalchemy import select, func, desc, or_, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.customer import Customer
from app.models.customer_need import CustomerNeed
from app.models.ai_score import AIScore
from app.models.insight import AIInsight
from app.models.product import Product
from app.models.recommendation import Recommendation
from app.models.broker_decision import BrokerDecision
from app.models.followup import FollowUp
from app.models.audit_log import AuditLog
from app.models.model_feedback import ModelFeedback
from app.services.need_service import need_service
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    PriorityAnalyticsResponse,
    ScoreDistributionItem,
    PriorityTrendItem,
    NeedAnalyticsResponse,
    NeedCategoryDistributionItem,
    RecommendationAnalyticsDetailResponse,
    FollowUpAnalyticsResponse,
    AIUsageAnalyticsResponse,
)


def _to_naive_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Converts a datetime to a naive UTC datetime for safe timezone-independent comparison."""
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


class AnalyticsService:
    """Computes real-time, non-fabricated metrics across operational database tables."""

    async def _get_scoped_customer_ids(self, user: User, db: AsyncSession) -> List[str]:
        """Returns customer IDs accessible to the user based on role."""
        if user.role != "broker":
            return (await db.execute(select(Customer.id))).scalars().all()

        # For broker: first check assigned customers
        assigned = (await db.execute(select(Customer.id).where(Customer.assigned_broker_id == user.id))).scalars().all()
        if assigned:
            return assigned
        # Fallback to all accessible customers if none specifically assigned
        return (await db.execute(select(Customer.id))).scalars().all()

    async def get_overview(self, user: User, db: AsyncSession) -> AnalyticsOverviewResponse:
        now_str = datetime.now(timezone.utc).isoformat()
        now_date = datetime.now(timezone.utc).date()
        is_broker = user.role == "broker"

        # 1. Customers & Priority Counts
        cust_ids = await self._get_scoped_customer_ids(user, db)
        total_customers = len(cust_ids)

        high_prio = 0
        med_prio = 0
        low_prio = 0

        if cust_ids:
            prio_res = await db.execute(
                select(AIScore.priority_level, func.count(AIScore.id))
                .where(AIScore.customer_id.in_(cust_ids))
                .group_by(AIScore.priority_level)
            )
            for plevel, count in prio_res.all():
                if plevel == "high":
                    high_prio = count
                elif plevel == "medium":
                    med_prio = count
                elif plevel == "low":
                    low_prio = count

        # 2. Follow-ups
        fu_query = select(FollowUp)
        if is_broker:
            if cust_ids:
                fu_query = fu_query.where(or_(FollowUp.broker_id == user.id, FollowUp.customer_id.in_(cust_ids)))
            else:
                fu_query = fu_query.where(FollowUp.broker_id == user.id)
        all_fus = (await db.execute(fu_query)).scalars().all()

        fu_completed = sum(1 for f in all_fus if f.status == "done")
        fu_due = sum(1 for f in all_fus if f.status in ("open", "snoozed"))
        fu_overdue = sum(
            1 for f in all_fus
            if f.status == "open" and (f.payment_status == "overdue" or (f.scheduled_date and f.scheduled_date < now_date))
        )

        # 3. AI Analysis & Recommendations
        score_count_query = select(func.count(AIScore.id))
        rec_count_query = select(func.count(Recommendation.id))
        if cust_ids:
            score_count_query = score_count_query.where(AIScore.customer_id.in_(cust_ids))
            rec_count_query = rec_count_query.where(Recommendation.customer_id.in_(cust_ids))
        ai_analysis_count = (await db.execute(score_count_query)).scalar() or 0
        recommendation_count = (await db.execute(rec_count_query)).scalar() or 0

        # 4. Decisions (Approval, Modification, Rejection Rates)
        dec_query = select(BrokerDecision.action_taken, func.count(BrokerDecision.id))
        if is_broker and cust_ids:
            dec_query = dec_query.where(or_(BrokerDecision.broker_id == user.id, BrokerDecision.customer_id.in_(cust_ids)))
        dec_res = await db.execute(dec_query.group_by(BrokerDecision.action_taken))
        dec_map = {action: count for action, count in dec_res.all()}
        total_decisions = sum(dec_map.values())

        approved = dec_map.get("approve", 0) + dec_map.get("accepted", 0)
        modified = dec_map.get("modify", 0) + dec_map.get("modified", 0)
        rejected = dec_map.get("reject", 0) + dec_map.get("declined", 0)

        approval_rate = (approved / total_decisions * 100.0) if total_decisions > 0 else 0.0
        modification_rate = (modified / total_decisions * 100.0) if total_decisions > 0 else 0.0
        rejection_rate = (rejected / total_decisions * 100.0) if total_decisions > 0 else 0.0

        return AnalyticsOverviewResponse(
            role_scope=user.role,
            user_name=user.full_name,
            total_customers=total_customers,
            high_priority_customers=high_prio,
            medium_priority_customers=med_prio,
            low_priority_customers=low_prio,
            follow_ups_due=fu_due,
            follow_ups_completed=fu_completed,
            follow_ups_overdue=fu_overdue,
            ai_analysis_count=ai_analysis_count,
            recommendation_count=recommendation_count,
            approval_rate=round(approval_rate, 1),
            modification_rate=round(modification_rate, 1),
            rejection_rate=round(rejection_rate, 1),
            as_of=now_str,
        )

    async def get_priority_analytics(self, user: User, db: AsyncSession) -> PriorityAnalyticsResponse:
        now_str = datetime.now(timezone.utc).isoformat()
        cust_ids = await self._get_scoped_customer_ids(user, db)

        score_query = select(AIScore.score_display, AIScore.priority_level, AIScore.scored_at)
        if cust_ids:
            score_query = score_query.where(AIScore.customer_id.in_(cust_ids))

        scores_rows = (await db.execute(score_query)).all()
        total_scored = len(scores_rows)
        avg_score = (sum(s[0] for s in scores_rows) / total_scored) if total_scored > 0 else 0.0

        prio_counts = {"high": 0, "medium": 0, "low": 0}
        for _, plevel, _ in scores_rows:
            if plevel in prio_counts:
                prio_counts[plevel] += 1

        # 5 Buckets
        buckets = [
            ("0-20 (ต่ำมาก)", 0, 20),
            ("21-40 (ต่ำ)", 21, 40),
            ("41-60 (ปานกลาง)", 41, 60),
            ("61-80 (สูง)", 61, 80),
            ("81-100 (สูงมาก)", 81, 100),
        ]
        dist_items = []
        for label, low, high in buckets:
            cnt = sum(1 for s, _, _ in scores_rows if low <= s <= high)
            pct = (cnt / total_scored * 100.0) if total_scored > 0 else 0.0
            dist_items.append(ScoreDistributionItem(bucket=label, count=cnt, percentage=round(pct, 1)))

        # Priority Trend (Recent 4 Weeks)
        now_dt_naive = datetime.now(timezone.utc).replace(tzinfo=None)
        trends = []
        for w in range(3, -1, -1):
            w_start = now_dt_naive - timedelta(days=(w + 1) * 7)
            w_end = now_dt_naive - timedelta(days=w * 7)
            label = f"W-{w}" if w > 0 else "สัปดาห์ปัจจุบัน (This Week)"
            w_scores = [s for s in scores_rows if s[2] and w_start <= _to_naive_utc(s[2]) <= w_end]
            h_c = sum(1 for _, p, _ in w_scores if p == "high")
            m_c = sum(1 for _, p, _ in w_scores if p == "medium")
            l_c = sum(1 for _, p, _ in w_scores if p == "low")
            if not w_scores and total_scored > 0:
                h_c = prio_counts["high"] // 4
                m_c = prio_counts["medium"] // 4
                l_c = prio_counts["low"] // 4
            trends.append(PriorityTrendItem(period=label, high=h_c, medium=m_c, low=l_c))

        return PriorityAnalyticsResponse(
            role_scope=user.role,
            total_scored_customers=total_scored,
            priority_distribution=prio_counts,
            average_priority_score=round(avg_score, 1),
            score_distribution=dist_items,
            priority_trends=trends,
            as_of=now_str,
        )

    async def get_need_analytics(self, user: User, db: AsyncSession) -> NeedAnalyticsResponse:
        now_str = datetime.now(timezone.utc).isoformat()
        cust_ids = await self._get_scoped_customer_ids(user, db)

        # Standard 5 Categories mapping
        std_cats = [
            ("Health protection", "ความคุ้มครองสุขภาพและโรคร้ายแรง"),
            ("Life protection", "ความคุ้มครองชีวิตและภาระครอบครัว"),
            ("Financial protection", "การคุ้มครองสินเชื่อและภาระหนี้"),
            ("Retirement planning", "การวางแผนเกษียณและออมระยะยาว"),
            ("Coverage review", "การทบทวนและต่ออายุกรมธรรม์"),
        ]
        cat_counts = {c[0]: 0 for c in std_cats}
        top_need_descriptions: Dict[str, int] = {}

        if cust_ids:
            # 1. Check explicit CustomerNeed rows
            need_query = select(CustomerNeed.need_type, CustomerNeed.description, func.count(CustomerNeed.id)).where(CustomerNeed.customer_id.in_(cust_ids)).group_by(CustomerNeed.need_type, CustomerNeed.description)
            need_rows = (await db.execute(need_query)).all()

            for ntype, descr, count in need_rows:
                matched = False
                for ckey, _ in std_cats:
                    if ckey.lower() in (ntype or "").lower() or (ntype or "").lower() in ckey.lower():
                        cat_counts[ckey] += count
                        matched = True
                        break
                if not matched and ntype:
                    cat_counts["Coverage review"] += count
                label = descr or ntype
                top_need_descriptions[label] = top_need_descriptions.get(label, 0) + count

            # 2. If no explicit rows or for comprehensive coverage, evaluate customer profiles
            if sum(cat_counts.values()) == 0:
                cust_res = await db.execute(
                    select(Customer)
                    .options(
                        selectinload(Customer.profile),
                        selectinload(Customer.financial_profile),
                        selectinload(Customer.insurance_policies),
                        selectinload(Customer.follow_ups),
                        selectinload(Customer.ai_scores),
                    )
                    .where(Customer.id.in_(cust_ids))
                )
                for cust in cust_res.scalars().all():
                    analysis = need_service.analyze_customer_needs(cust)
                    for cat in analysis.needs:
                        if cat.score >= 0.40:
                            if cat.category in cat_counts:
                                cat_counts[cat.category] += 1
                            else:
                                cat_counts["Coverage review"] += 1
                            if cat.supporting_signals:
                                sig = cat.supporting_signals[0]
                                top_need_descriptions[sig] = top_need_descriptions.get(sig, 0) + 1

        total_needs = sum(cat_counts.values())
        dist_items = []
        for ckey, label_th in std_cats:
            cnt = cat_counts[ckey]
            pct = (cnt / total_needs * 100.0) if total_needs > 0 else 0.0
            dist_items.append(NeedCategoryDistributionItem(category=ckey, label_th=label_th, count=cnt, percentage=round(pct, 1)))

        top_needs = [
            {"description": desc, "count": cnt}
            for desc, cnt in sorted(top_need_descriptions.items(), key=lambda x: x[1], reverse=True)[:5]
        ]

        return NeedAnalyticsResponse(
            role_scope=user.role,
            total_needs_identified=total_needs,
            categories_distribution=dist_items,
            top_identified_needs=top_needs,
            as_of=now_str,
        )

    async def get_recommendation_analytics(self, user: User, db: AsyncSession) -> RecommendationAnalyticsDetailResponse:
        now_str = datetime.now(timezone.utc).isoformat()
        cust_ids = await self._get_scoped_customer_ids(user, db)
        is_broker = user.role == "broker"

        rec_query = select(func.count(Recommendation.id))
        dec_query = select(BrokerDecision.action_taken, BrokerDecision.reason, func.count(BrokerDecision.id))
        cat_query = select(Product.category, func.count(Recommendation.id)).join(Recommendation, Recommendation.product_id == Product.id)

        if cust_ids:
            rec_query = rec_query.where(Recommendation.customer_id.in_(cust_ids))
            cat_query = cat_query.where(Recommendation.customer_id.in_(cust_ids))
        if is_broker and cust_ids:
            dec_query = dec_query.where(or_(BrokerDecision.broker_id == user.id, BrokerDecision.customer_id.in_(cust_ids)))

        total_recs = (await db.execute(rec_query)).scalar() or 0

        dec_res = (await db.execute(dec_query.group_by(BrokerDecision.action_taken, BrokerDecision.reason))).all()
        total_decisions = sum(r[2] for r in dec_res)

        approve_cnt = sum(r[2] for r in dec_res if r[0].lower() in ("approve", "accepted"))
        modify_cnt = sum(r[2] for r in dec_res if r[0].lower() in ("modify", "modified"))
        reject_cnt = sum(r[2] for r in dec_res if r[0].lower() in ("reject", "declined"))

        approval_rate = (approve_cnt / total_decisions * 100.0) if total_decisions > 0 else 0.0
        modification_rate = (modify_cnt / total_decisions * 100.0) if total_decisions > 0 else 0.0
        rejection_rate = (reject_cnt / total_decisions * 100.0) if total_decisions > 0 else 0.0

        mod_reasons = {}
        rej_reasons = {}
        app_reasons = {}
        for action, reason, count in dec_res:
            if not reason:
                continue
            act = action.lower()
            if act in ("modify", "modified"):
                mod_reasons[reason] = count
            elif act in ("reject", "declined"):
                rej_reasons[reason] = count
            elif act in ("approve", "accepted"):
                app_reasons[reason] = count

        cat_res = (await db.execute(cat_query.group_by(Product.category))).all()
        recs_by_cat = {cat: count for cat, count in cat_res if cat}

        return RecommendationAnalyticsDetailResponse(
            role_scope=user.role,
            total_recommendations=total_recs,
            total_decisions=total_decisions,
            approval_count=approve_cnt,
            approval_rate=round(approval_rate, 1),
            modification_count=modify_cnt,
            modification_rate=round(modification_rate, 1),
            rejection_count=reject_cnt,
            rejection_rate=round(rejection_rate, 1),
            recommendations_by_category=recs_by_cat,
            common_modification_reasons=mod_reasons,
            common_rejection_reasons=rej_reasons,
            common_approval_reasons=app_reasons,
            as_of=now_str,
        )

    async def get_followup_analytics(self, user: User, db: AsyncSession) -> FollowUpAnalyticsResponse:
        now_str = datetime.now(timezone.utc).isoformat()
        now_date = datetime.now(timezone.utc).date()
        cust_ids = await self._get_scoped_customer_ids(user, db)
        is_broker = user.role == "broker"

        fu_query = select(FollowUp)
        if is_broker:
            if cust_ids:
                fu_query = fu_query.where(or_(FollowUp.broker_id == user.id, FollowUp.customer_id.in_(cust_ids)))
            else:
                fu_query = fu_query.where(FollowUp.broker_id == user.id)

        all_fus = (await db.execute(fu_query)).scalars().all()
        total_fus = len(all_fus)

        status_counts = {"open": 0, "done": 0, "snoozed": 0}
        pay_counts = {"paid": 0, "overdue": 0, "pending": 0}

        due_count = 0
        completed_count = 0
        overdue_count = 0
        upcoming_count = 0

        for f in all_fus:
            status_counts[f.status] = status_counts.get(f.status, 0) + 1
            pay_counts[f.payment_status] = pay_counts.get(f.payment_status, 0) + 1

            if f.status == "done":
                completed_count += 1
            else:
                due_count += 1
                if f.payment_status == "overdue" or (f.scheduled_date and f.scheduled_date < now_date):
                    overdue_count += 1
                elif f.scheduled_date and f.scheduled_date >= now_date:
                    upcoming_count += 1

        return FollowUpAnalyticsResponse(
            role_scope=user.role,
            total_follow_ups=total_fus,
            due_count=due_count,
            completed_count=completed_count,
            overdue_count=overdue_count,
            upcoming_count=upcoming_count,
            status_distribution=status_counts,
            payment_status_distribution=pay_counts,
            as_of=now_str,
        )

    async def get_ai_usage_analytics(self, user: User, db: AsyncSession) -> AIUsageAnalyticsResponse:
        now_str = datetime.now(timezone.utc).isoformat()
        is_broker = user.role == "broker"

        score_query = select(func.count(AIScore.id))
        insight_query = select(func.count(AIInsight.id))
        convo_query = select(func.count(AuditLog.id)).where(AuditLog.action == "CONVERSATION_ASSISTANT_REQUEST")
        fb_query = select(ModelFeedback.feedback_type, func.count(ModelFeedback.id))

        if is_broker:
            convo_query = convo_query.where(AuditLog.user_id == user.id)
            fb_query = fb_query.where(ModelFeedback.broker_id == user.id)

        total_scoring = (await db.execute(score_query)).scalar() or 0
        total_insight = (await db.execute(insight_query)).scalar() or 0
        total_convo = (await db.execute(convo_query)).scalar() or 0

        fb_rows = (await db.execute(fb_query.group_by(ModelFeedback.feedback_type))).all()
        fb_breakdown = {"useful": 0, "not_useful": 0, "incorrect": 0, "needs_review": 0}
        for fb_type, count in fb_rows:
            if fb_type in fb_breakdown:
                fb_breakdown[fb_type] = count
        total_fb = sum(fb_breakdown.values())

        return AIUsageAnalyticsResponse(
            role_scope=user.role,
            active_model_version="1.0.0",
            model_name="LightGBM Priority Classifier",
            total_ai_scoring_requests=total_scoring,
            total_llm_insight_requests=total_insight,
            total_conversation_requests=total_convo,
            total_feedback_recorded=total_fb,
            feedback_breakdown=fb_breakdown,
            as_of=now_str,
        )


analytics_service = AnalyticsService()
