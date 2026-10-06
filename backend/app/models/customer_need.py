"""CustomerNeed ORM model."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CustomerNeed(Base):
    __tablename__ = "customer_needs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("customers.id", ondelete="CASCADE"), index=True
    )
    need_type: Mapped[str] = mapped_column(String(100), nullable=False)  # Protection Gap, Wealth Accumulation, Retirement
    severity: Mapped[str] = mapped_column(String(20), default="medium")  # high, medium, low
    description: Mapped[str] = mapped_column(Text, nullable=False)
    identified_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    customer: Mapped["Customer"] = relationship(back_populates="needs")  # noqa: F821
