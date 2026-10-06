"""BrokerDecision ORM model for capturing broker decisions and structured feedback on AI recommendations."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BrokerDecision(Base):
    __tablename__ = "broker_decisions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("customers.id", ondelete="CASCADE"), index=True
    )
    broker_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), index=True
    )
    recommendation_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("recommendations.id"), nullable=True, index=True
    )
    product_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("products.id"), nullable=True, index=True
    )
    action_taken: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # approve, modify, reject
    reason: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    ai_recommendation: Mapped[str | None] = mapped_column(String(150), nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    decision_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    customer: Mapped["Customer"] = relationship(back_populates="broker_decisions")  # noqa: F821
    broker: Mapped["User"] = relationship(back_populates="decisions")  # noqa: F821
    recommendation: Mapped["Recommendation | None"] = relationship(back_populates="decisions")  # noqa: F821
    product: Mapped["Product | None"] = relationship()  # noqa: F821
