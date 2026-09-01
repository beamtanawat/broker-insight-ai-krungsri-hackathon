"""
Central Audit Logging helper for Broker Insight AI.
Records system operations with user, action, target entity, timestamp, and model metadata.
"""
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.models.audit_log import AuditLog

logger = structlog.get_logger()


async def log_audit_event(
    db: AsyncSession,
    user_id: Optional[str],
    action: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> AuditLog:
    """
    Creates and persists an AuditLog entry in the database.
    Does not log sensitive customer PII or raw secrets.
    """
    clean_meta = dict(metadata or {})

    entry = AuditLog(
        user_id=user_id,
        action=action.upper(),
        entity_type=entity_type.upper() if entity_type else None,
        entity_id=str(entity_id) if entity_id else None,
        metadata_=clean_meta,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(entry)
    await db.commit()
    logger.info(
        "audit_event_recorded",
        action=entry.action,
        user_id=user_id,
        entity_type=entry.entity_type,
        entity_id=entry.entity_id,
    )
    return entry
