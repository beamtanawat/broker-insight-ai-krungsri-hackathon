"""Scoring router — LightGBM + SHAP."""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.customer import Customer
from app.models.ai_score import AIScore
from app.services.scoring_service import score_customer

router = APIRouter()


@router.get("/{customer_id}")
async def get_score(
    customer_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AIScore)
        .where(AIScore.customer_id == customer_id)
        .order_by(desc(AIScore.scored_at))
        .limit(1)
    )
    score = result.scalar_one_or_none()
    if not score:
        raise HTTPException(status_code=404, detail="No score found for this customer")

    return {
        "id": score.id,
        "customer_id": score.customer_id,
        "score": score.score,
        "score_display": score.score_display,
        "priority_level": score.priority_level,
        "shap_reasons": score.feature_importance,
        "scored_at": score.scored_at,
        "model_version": score.model_version,
    }


@router.post("/{customer_id}/refresh")
async def refresh_score(
    customer_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Re-run LightGBM scoring for a customer."""
    result = await db.execute(select(Customer).options(
        selectinload(Customer.financial_profile)
    ).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    new_score = await score_customer(customer, db)
    return {
        "message": "Score refreshed",
        "score_display": new_score.score_display,
        "priority_level": new_score.priority_level,
    }
