"""Dashboard metrics router with Broker, Manager and Admin views."""
from datetime import datetime, timezone, date
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.customer import Customer, CustomerProfile
from app.models.ai_score import AIScore
from app.models.followup import FollowUp
from app.models.insurance import InsurancePolicy
from app.models.product import Product
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    PriorityBreakdown,
    KYCBreakdown,
)

router = APIRouter()


@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get portfolio summary metrics."""
    # If broker, calculate metrics for assigned customers
    cust_query = select(Customer.id)
    if current_user.role == "broker":
        cust_query = cust_query.where(Customer.assigned_broker_id == current_user.id)

    total_cust_res = await db.execute(select(func.count()).select_from(cust_query.subquery()))
    total_customers = total_cust_res.scalar_one() or 0

    # Priority breakdown
    high_score_res = await db.execute(
        select(func.count(AIScore.id))
        .join(Customer, Customer.id == AIScore.customer_id)
        .where(
            AIScore.priority_level == "high",
            Customer.assigned_broker_id == current_user.id if current_user.role == "broker" else True,
        )
    )
    high_count = high_score_res.scalar_one() or 0

    med_score_res = await db.execute(
        select(func.count(AIScore.id))
        .join(Customer, Customer.id == AIScore.customer_id)
        .where(
            AIScore.priority_level == "medium",
            Customer.assigned_broker_id == current_user.id if current_user.role == "broker" else True,
        )
    )
    med_count = med_score_res.scalar_one() or 0

    low_score_res = await db.execute(
        select(func.count(AIScore.id))
        .join(Customer, Customer.id == AIScore.customer_id)
        .where(
            AIScore.priority_level == "low",
            Customer.assigned_broker_id == current_user.id if current_user.role == "broker" else True,
        )
    )
    low_count = low_score_res.scalar_one() or 0

    unscored = max(0, total_customers - (high_count + med_count + low_count))

    # Follow-up status
    today = date.today()
    overdue_res = await db.execute(
        select(func.count(FollowUp.id))
        .where(
            FollowUp.status == "open",
            FollowUp.scheduled_date < today,
            FollowUp.broker_id == current_user.id if current_user.role == "broker" else True,
        )
    )
    overdue_count = overdue_res.scalar_one() or 0

    open_res = await db.execute(
        select(func.count(FollowUp.id))
        .where(
            FollowUp.status == "open",
            FollowUp.broker_id == current_user.id if current_user.role == "broker" else True,
        )
    )
    open_count = open_res.scalar_one() or 0

    # KYC breakdown
    kyc_verified_res = await db.execute(
        select(func.count(CustomerProfile.id))
        .join(Customer, Customer.id == CustomerProfile.customer_id)
        .where(
            CustomerProfile.kyc_status == "verified",
            Customer.assigned_broker_id == current_user.id if current_user.role == "broker" else True,
        )
    )
    kyc_pending_res = await db.execute(
        select(func.count(CustomerProfile.id))
        .join(Customer, Customer.id == CustomerProfile.customer_id)
        .where(
            CustomerProfile.kyc_status == "pending",
            Customer.assigned_broker_id == current_user.id if current_user.role == "broker" else True,
        )
    )
    kyc_rejected_res = await db.execute(
        select(func.count(CustomerProfile.id))
        .join(Customer, Customer.id == CustomerProfile.customer_id)
        .where(
            CustomerProfile.kyc_status == "rejected",
            Customer.assigned_broker_id == current_user.id if current_user.role == "broker" else True,
        )
    )

    # Policies metrics
    active_policies_res = await db.execute(
        select(
            func.count(InsurancePolicy.id),
            func.coalesce(func.sum(InsurancePolicy.coverage_amount), 0.0),
        )
        .join(Customer, Customer.id == InsurancePolicy.customer_id)
        .where(
            InsurancePolicy.status == "Active",
            Customer.assigned_broker_id == current_user.id if current_user.role == "broker" else True,
        )
    )
    pol_row = active_policies_res.first()
    active_policies_count = pol_row[0] if pol_row else 0
    total_coverage = float(pol_row[1]) if pol_row else 0.0

    # Total products in catalog
    prod_res = await db.execute(select(func.count(Product.id)).where(Product.is_active == True))
    total_products = prod_res.scalar_one() or 0

    return DashboardSummaryResponse(
        total_customers=total_customers,
        priority_breakdown=PriorityBreakdown(
            high=high_count,
            medium=med_count,
            low=low_count,
            unscored=unscored,
        ),
        overdue_followups_count=overdue_count,
        open_followups_count=open_count,
        kyc_breakdown=KYCBreakdown(
            verified=kyc_verified_res.scalar_one() or 0,
            pending=kyc_pending_res.scalar_one() or 0,
            rejected=kyc_rejected_res.scalar_one() or 0,
        ),
        total_active_policies=active_policies_count,
        total_coverage_amount=total_coverage,
        total_products_available=total_products,
        as_of=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/team")
async def get_team_summary(
    current_user: User = Depends(require_role("manager", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """Manager & Admin only: Team-level broker activities and customer distribution."""
    # List all brokers and count assigned customers and follow-ups
    brokers_res = await db.execute(
        select(User).options(
            selectinload(User.assigned_customers),
            selectinload(User.follow_ups),
        ).where(User.role == "broker")
    )
    brokers = brokers_res.scalars().all()

    today = date.today()
    team_data = []
    for b in brokers:
        overdue_fu = len([f for f in b.follow_ups if f.status == "open" and f.scheduled_date and f.scheduled_date < today])
        team_data.append({
            "broker_id": b.id,
            "broker_name": b.full_name,
            "email": b.email,
            "assigned_customers_count": len(b.assigned_customers),
            "open_followups_count": len([f for f in b.follow_ups if f.status == "open"]),
            "overdue_followups_count": overdue_fu,
        })

    return {
        "manager_id": current_user.id,
        "manager_name": current_user.full_name,
        "total_brokers": len(brokers),
        "brokers": team_data,
        "as_of": datetime.now(timezone.utc).isoformat(),
    }
