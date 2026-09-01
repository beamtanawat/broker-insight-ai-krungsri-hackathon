"""
Pilot Evaluation ORM Models (Phase 30).
Defines PilotSession, PilotFeedback, and PilotIssue for controlled pilot evaluation.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional, List

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PilotSession(Base):
    """Tracks a single broker pilot evaluation session on a scenario."""
    __tablename__ = "pilot_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    scenario_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # scenario_a, scenario_b, etc.
    customer_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="in_progress")  # in_progress, completed, abandoned
    time_taken_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    features_used: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship()  # noqa: F821
    feedbacks: Mapped[List["PilotFeedback"]] = relationship(back_populates="session", cascade="all, delete-orphan")
    issues: Mapped[List["PilotIssue"]] = relationship(back_populates="session", cascade="all, delete-orphan")


class PilotFeedback(Base):
    """Structured questionnaire and qualitative feedback submitted after a pilot session."""
    __tablename__ = "pilot_feedbacks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("pilot_sessions.id", ondelete="SET NULL"), nullable=True, index=True
    )
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    scenario_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # 1-5 Likert scale ratings
    rating_overall: Mapped[int] = mapped_column(Integer, nullable=False)
    rating_ease_of_use: Mapped[int] = mapped_column(Integer, nullable=False)
    rating_clarity_priority: Mapped[int] = mapped_column(Integer, nullable=False)
    rating_shap_explanation: Mapped[int] = mapped_column(Integer, nullable=False)
    rating_insight_usefulness: Mapped[int] = mapped_column(Integer, nullable=False)
    rating_recommendations: Mapped[int] = mapped_column(Integer, nullable=False)
    rating_trust: Mapped[int] = mapped_column(Integer, nullable=False)

    # Qualitative fields
    most_useful_feature: Mapped[str | None] = mapped_column(String(100), nullable=True)
    least_useful_feature: Mapped[str | None] = mapped_column(String(100), nullable=True)
    confusing_part: Mapped[str | None] = mapped_column(Text, nullable=True)
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )

    session: Mapped["PilotSession | None"] = relationship(back_populates="feedbacks")
    user: Mapped["User"] = relationship()  # noqa: F821


class PilotIssue(Base):
    """Captures issues and observations discovered during pilot evaluation."""
    __tablename__ = "pilot_issues"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("pilot_sessions.id", ondelete="SET NULL"), nullable=True, index=True
    )
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    severity: Mapped[str] = mapped_column(String(10), nullable=False, index=True)  # P0, P1, P2
    scenario_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    component: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    steps_to_reproduce: Mapped[str | None] = mapped_column(Text, nullable=True)
    request_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="open", index=True)  # open, in_progress, resolved
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )

    session: Mapped["PilotSession | None"] = relationship(back_populates="issues")
    user: Mapped["User"] = relationship()  # noqa: F821
