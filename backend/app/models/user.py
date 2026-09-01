"""User ORM model."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("roles.id"), nullable=True)
    role: Mapped[str] = mapped_column(String(50), default="broker", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    role_rel: Mapped["Role | None"] = relationship(back_populates="users")  # noqa: F821
    assigned_customers: Mapped[list["Customer"]] = relationship(back_populates="assigned_broker")  # noqa: F821
    interactions: Mapped[list["CustomerInteraction"]] = relationship(back_populates="broker")  # noqa: F821
    follow_ups: Mapped[list["FollowUp"]] = relationship(back_populates="broker")  # noqa: F821
    decisions: Mapped[list["BrokerDecision"]] = relationship(back_populates="broker")  # noqa: F821
    audit_logs: Mapped[list["AuditLog"]] = relationship(back_populates="user")  # noqa: F821
    model_feedbacks: Mapped[list["ModelFeedback"]] = relationship(back_populates="broker")  # noqa: F821
