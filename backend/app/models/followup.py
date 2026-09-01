"""FollowUp ORM model."""
import uuid
from datetime import datetime, timezone, date

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class FollowUp(Base):
    __tablename__ = "follow_ups"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("customers.id", ondelete="CASCADE"), index=True
    )
    broker_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True, index=True
    )
    scheduled_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    last_contact_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    follow_up_window: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Before Renewal, Post Claim, Annual Review
    status: Mapped[str] = mapped_column(
        Enum("open", "done", "snoozed", "cancelled", name="followup_status_enum"),
        default="open",
        index=True,
    )
    priority: Mapped[str] = mapped_column(String(20), default="medium")  # high, medium, low
    payment_status: Mapped[str] = mapped_column(
        Enum("paid", "overdue", "pending", name="followup_payment_status_enum"), default="paid"
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    customer: Mapped["Customer"] = relationship(back_populates="follow_ups")  # noqa: F821
    broker: Mapped["User | None"] = relationship(back_populates="follow_ups")  # noqa: F821
