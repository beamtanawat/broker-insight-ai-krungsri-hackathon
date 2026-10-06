"""Insights router — Gemini LLM."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.customer import Customer
from app.models.insight import AIInsight
from app.models.ai_score import AIScore
from app.services.insight_service import generate_insight

router = APIRouter()


@router.get("/{customer_id}")
async def get_insight(
    customer_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AIInsight)
        .where(AIInsight.customer_id == customer_id)
        .order_by(desc(AIInsight.generated_at))
        .limit(1)
    )
    insight = result.scalar_one_or_none()
    if not insight:
        raise HTTPException(status_code=404, detail="No insight found. POST to /generate first.")

    return {
        "id": insight.id,
        "customer_id": insight.customer_id,
        "insight_text": insight.insight_text,
        "discussion_topics": insight.discussion_topics,
        "model": insight.model,
        "generated_at": insight.generated_at,
        "reviewed_by": insight.reviewed_by,
        "reviewed_at": insight.reviewed_at,
    }


@router.post("/{customer_id}/generate")
async def generate(
    customer_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Customer)
        .options(
            selectinload(Customer.financial_snapshot),
            selectinload(Customer.priority_scores),
        )
        .where(Customer.id == customer_id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    latest_score = customer.priority_scores[0] if customer.priority_scores else None
    insight = await generate_insight(customer, latest_score, db)

    return {
        "id": insight.id,
        "insight_text": insight.insight_text,
        "discussion_topics": insight.discussion_topics,
        "generated_at": insight.generated_at,
    }


@router.patch("/{insight_id}/review")
async def mark_reviewed(
    insight_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(AIInsight).where(AIInsight.id == insight_id))
    insight = result.scalar_one_or_none()
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")

    insight.reviewed_by = current_user.id
    insight.reviewed_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Marked as reviewed"}
