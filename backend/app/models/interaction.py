"""CustomerInteraction ORM model."""
import uuid
from datetime import datetime, timezone, date

from sqlalchemy import Date, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CustomerInteraction(Base):
    __tablename__ = "customer_interactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("customers.id", ondelete="CASCADE"), index=True
    )
    broker_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True, index=True
    )
    channel: Mapped[str] = mapped_column(String(50), nullable=False)  # Phone, Branch, Digital, Line
    interaction_type: Mapped[str] = mapped_column(String(100), nullable=False)  # Annual Review, Inquiry, Claim, Follow-up
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    interaction_date: Mapped[date] = mapped_column(Date, default=lambda: date.today(), index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    customer: Mapped["Customer"] = relationship(back_populates="interactions")  # noqa: F821
    broker: Mapped["User | None"] = relationship(back_populates="interactions")  # noqa: F821
