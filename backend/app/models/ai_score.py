"""AIScore ORM model."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AIScore(Base):
    __tablename__ = "ai_scores"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("customers.id", ondelete="CASCADE"), index=True
    )
    score: Mapped[float] = mapped_column(Float, nullable=False)          # 0.0 - 1.0 raw ML score
    score_display: Mapped[int] = mapped_column(Integer, nullable=False)  # 0 - 100 scaled
    priority_level: Mapped[str] = mapped_column(
        Enum("high", "medium", "low", name="priority_level_enum"), nullable=False, index=True
    )
    shap_values: Mapped[dict] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"), default=dict
    )
    feature_importance: Mapped[list] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"), default=list
    )
    scored_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
    model_version: Mapped[str] = mapped_column(String(50), nullable=False, default="1.0.0")

    customer: Mapped["Customer"] = relationship(back_populates="ai_scores")  # noqa: F821
    insights: Mapped[list["AIInsight"]] = relationship(back_populates="score")  # noqa: F821
