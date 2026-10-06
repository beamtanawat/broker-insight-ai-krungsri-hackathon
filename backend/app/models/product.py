"""Product ORM model."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)  # Life, Health, Investment, Loan
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    min_coverage: Mapped[float] = mapped_column(Float, default=0.0)
    max_coverage: Mapped[float] = mapped_column(Float, default=0.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    recommendations: Mapped[list["Recommendation"]] = relationship(back_populates="product")  # noqa: F821
