"""ModelFeedback ORM model for capturing broker evaluations on AI predictions."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ModelFeedback(Base):
    __tablename__ = "model_feedback"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    prediction_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("ai_scores.id", ondelete="SET NULL"), nullable=True, index=True
    )
    customer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("customers.id", ondelete="CASCADE"), index=True
    )
    broker_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    feedback_type: Mapped[str] = mapped_column(
        Enum("useful", "not_useful", "incorrect", "needs_review", name="feedback_type_enum"),
        nullable=False,
        index=True,
    )
    reason: Mapped[str | None] = mapped_column(String(100), nullable=True)
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )

    customer: Mapped["Customer"] = relationship(back_populates="model_feedbacks")  # noqa: F821
    broker: Mapped["User"] = relationship(back_populates="model_feedbacks")  # noqa: F821
    ai_score: Mapped["AIScore | None"] = relationship()  # noqa: F821
