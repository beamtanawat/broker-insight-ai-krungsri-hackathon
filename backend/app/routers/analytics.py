"""
Advanced Broker and Manager Analytics Router.
Provides operational analytics across priorities, customer needs, recommendations,
follow-ups, and AI model usage with role-based scoping.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.analytics_service import analytics_service
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    PriorityAnalyticsResponse,
    NeedAnalyticsResponse,
    RecommendationAnalyticsDetailResponse,
    FollowUpAnalyticsResponse,
    AIUsageAnalyticsResponse,
)

router = APIRouter()


@router.get("/overview", response_model=AnalyticsOverviewResponse)
async def get_analytics_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns top-level dashboard metrics derived from the database, scoped to the caller's role."""
    return await analytics_service.get_overview(current_user, db)


@router.get("/priority", response_model=PriorityAnalyticsResponse)
async def get_priority_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns priority distribution, average priority score, 5-bucket score distribution, and weekly trends."""
    return await analytics_service.get_priority_analytics(current_user, db)


@router.get("/needs", response_model=NeedAnalyticsResponse)
async def get_need_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns customer need distribution across the 5 standard protection categories."""
    return await analytics_service.get_need_analytics(current_user, db)


@router.get("/recommendations", response_model=RecommendationAnalyticsDetailResponse)
async def get_recommendation_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns recommendation breakdown by category, approval/modification/rejection rates, and top change reasons."""
    return await analytics_service.get_recommendation_analytics(current_user, db)


@router.get("/follow-ups", response_model=FollowUpAnalyticsResponse)
async def get_followup_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns follow-up status breakdown: due, completed, overdue, upcoming, and payment status."""
    return await analytics_service.get_followup_analytics(current_user, db)


@router.get("/ai-usage", response_model=AIUsageAnalyticsResponse)
async def get_ai_usage_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns AI platform activity: ML scoring volume, LLM insights, conversation assistants, and feedback totals."""
    return await analytics_service.get_ai_usage_analytics(current_user, db)
