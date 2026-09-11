"""Follow-up router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.followup import FollowUp
from app.schemas.score import FollowUpUpdate

router = APIRouter()


@router.get("")
@router.get("/")
async def list_followups(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(FollowUp)
    if current_user.role == "broker":
        query = query.where(FollowUp.broker_id == current_user.id)
    result = await db.execute(query)
    items = result.scalars().all()
    return [_serialize(f) for f in items]


@router.get("/{followup_id}")
async def get_followup(
    followup_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(FollowUp).where(FollowUp.id == followup_id))
    f = result.scalar_one_or_none()
    if not f:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    return _serialize(f)


@router.patch("/{followup_id}")
async def update_followup(
    followup_id: str,
    body: FollowUpUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(FollowUp).where(FollowUp.id == followup_id))
    f = result.scalar_one_or_none()
    if not f:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    if body.notes is not None:
        f.notes = body.notes
    if body.status is not None:
        f.status = body.status
    if body.payment_status is not None:
        f.payment_status = body.payment_status
    await db.commit()
    return _serialize(f)


def _serialize(f: FollowUp) -> dict:
    return {
        "id": f.id,
        "customer_id": f.customer_id,
        "broker_id": f.broker_id,
        "renewal_date": str(getattr(f, "scheduled_date", None)) if getattr(f, "scheduled_date", None) else None,
        "scheduled_date": str(getattr(f, "scheduled_date", None)) if getattr(f, "scheduled_date", None) else None,
        "last_contact_date": str(f.last_contact_date) if getattr(f, "last_contact_date", None) else None,
        "payment_status": f.payment_status,
        "follow_up_window": f.follow_up_window,
        "engagement_status": getattr(f, "engagement_status", None),
        "priority": getattr(f, "priority", "medium"),
        "notes": f.notes,
        "status": f.status,
        "created_at": str(f.created_at) if f.created_at else None,
        "updated_at": str(f.updated_at) if f.updated_at else None,
    }
