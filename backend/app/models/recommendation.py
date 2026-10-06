"""Recommendation ORM model."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("customers.id", ondelete="CASCADE"), index=True
    )
    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="CASCADE"), index=True
    )
    rationale: Mapped[str] = mapped_column(Text, nullable=False)
    priority_rank: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(50), default="proposed")  # proposed, accepted, declined, reviewed
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    customer: Mapped["Customer"] = relationship(back_populates="recommendations")  # noqa: F821
    product: Mapped["Product"] = relationship(back_populates="recommendations")  # noqa: F821
    decisions: Mapped[list["BrokerDecision"]] = relationship(back_populates="recommendation")  # noqa: F821
