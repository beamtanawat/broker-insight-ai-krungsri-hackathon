"""Audit log router (admin only)."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.core.deps import require_role
from app.models.user import User
from app.models.audit_log import AuditLog

router = APIRouter()


@router.get("/")
async def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    offset = (page - 1) * page_size
    result = await db.execute(
        select(AuditLog)
        .order_by(desc(AuditLog.timestamp))
        .offset(offset)
        .limit(page_size)
    )
    logs = result.scalars().all()
    return {
        "items": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "metadata": log.metadata_,
                "timestamp": log.timestamp,
            }
            for log in logs
        ],
        "page": page,
        "page_size": page_size,
    }


async def write_audit(
    db: AsyncSession,
    user_id: str | None,
    action: str,
    entity_type: str | None = None,
    entity_id: str | None = None,
    metadata: dict | None = None,
):
    """Helper to create an audit log entry from any service."""
    entry = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        metadata_=metadata or {},
    )
    db.add(entry)
    await db.flush()
