"""Customer and CustomerProfile ORM models."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    external_ref: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    assigned_broker_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    assigned_broker: Mapped["User | None"] = relationship(back_populates="assigned_customers")  # noqa: F821
    profile: Mapped["CustomerProfile | None"] = relationship(  # noqa: F821
        back_populates="customer", uselist=False, cascade="all, delete-orphan"
    )
    financial_profile: Mapped["FinancialProfile | None"] = relationship(  # noqa: F821
        back_populates="customer", uselist=False, cascade="all, delete-orphan"
    )
    insurance_policies: Mapped[list["InsurancePolicy"]] = relationship(  # noqa: F821
        back_populates="customer", cascade="all, delete-orphan"
    )
    interactions: Mapped[list["CustomerInteraction"]] = relationship(  # noqa: F821
        back_populates="customer", cascade="all, delete-orphan"
    )
    ai_scores: Mapped[list["AIScore"]] = relationship(  # noqa: F821
        back_populates="customer", cascade="all, delete-orphan", order_by="AIScore.scored_at.desc()"
    )
    ai_insights: Mapped[list["AIInsight"]] = relationship(  # noqa: F821
        back_populates="customer", cascade="all, delete-orphan", order_by="AIInsight.generated_at.desc()"
    )
    needs: Mapped[list["CustomerNeed"]] = relationship(  # noqa: F821
        back_populates="customer", cascade="all, delete-orphan"
    )
    recommendations: Mapped[list["Recommendation"]] = relationship(  # noqa: F821
        back_populates="customer", cascade="all, delete-orphan"
    )
    broker_decisions: Mapped[list["BrokerDecision"]] = relationship(  # noqa: F821
        back_populates="customer", cascade="all, delete-orphan"
    )
    follow_ups: Mapped[list["FollowUp"]] = relationship(  # noqa: F821
        back_populates="customer", cascade="all, delete-orphan", order_by="FollowUp.created_at.desc()"
    )
    model_feedbacks: Mapped[list["ModelFeedback"]] = relationship(  # noqa: F821
        back_populates="customer", cascade="all, delete-orphan", order_by="ModelFeedback.created_at.desc()"
    )


class CustomerProfile(Base):
    __tablename__ = "customer_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("customers.id", ondelete="CASCADE"), unique=True, index=True
    )
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    occupation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    income_range: Mapped[str | None] = mapped_column(String(50), nullable=True)
    kyc_status: Mapped[str] = mapped_column(
        Enum("verified", "pending", "rejected", name="kyc_status_enum"), default="pending"
    )
    kyc_channel: Mapped[str | None] = mapped_column(String(50), nullable=True)
    risk_tolerance: Mapped[str | None] = mapped_column(String(50), nullable=True)  # Low, Moderate, High
    relationship_tier: Mapped[str | None] = mapped_column(String(50), default="Standard")  # Standard, Gold, Platinum
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True)
    province: Mapped[str | None] = mapped_column(String(100), nullable=True, default="กรุงเทพมหานคร")
    postal_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True, index=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    customer: Mapped["Customer"] = relationship(back_populates="profile")
