"""FinancialProfile ORM model."""
import uuid
from datetime import datetime, timezone, date

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class FinancialProfile(Base):
    __tablename__ = "financial_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("customers.id", ondelete="CASCADE"), unique=True, index=True
    )
    total_assets: Mapped[float] = mapped_column(Float, default=0.0)
    total_liabilities: Mapped[float] = mapped_column(Float, default=0.0)
    monthly_savings: Mapped[float] = mapped_column(Float, default=0.0)
    has_active_loan: Mapped[bool] = mapped_column(Boolean, default=False)
    loan_details: Mapped[str | None] = mapped_column(Text, nullable=True)
    products_held: Mapped[list] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"), default=list
    )
    transaction_frequency_90d: Mapped[int] = mapped_column(Integer, default=0)
    last_financial_activity: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    customer: Mapped["Customer"] = relationship(back_populates="financial_profile")  # noqa: F821
