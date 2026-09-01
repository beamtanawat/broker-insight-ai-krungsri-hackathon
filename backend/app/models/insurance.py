"""InsurancePolicy ORM model."""
import uuid
from datetime import datetime, timezone, date

from sqlalchemy import Date, DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class InsurancePolicy(Base):
    __tablename__ = "insurance_policies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("customers.id", ondelete="CASCADE"), index=True
    )
    policy_number: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    policy_type: Mapped[str] = mapped_column(String(100), nullable=False)  # Life, Health, Protection, Accident
    coverage_amount: Mapped[float] = mapped_column(Float, default=0.0)
    premium_amount: Mapped[float] = mapped_column(Float, default=0.0)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    renewal_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(50), default="Active")  # Active, Expired, Pending, Lapsed
    payment_status: Mapped[str] = mapped_column(
        Enum("paid", "overdue", "pending", name="policy_payment_status_enum"), default="paid"
    )
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    customer: Mapped["Customer"] = relationship(back_populates="insurance_policies")  # noqa: F821
