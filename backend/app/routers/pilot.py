"""
Pilot Evaluation Router (Phase 30).
Exposes endpoints for broker pilot sessions, Likert feedback questionnaires,
issue reporting, and aggregate evaluation dashboard.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.core.audit import log_audit_event
from app.models.user import User
from app.schemas.pilot import (
    PilotSessionCreate,
    PilotSessionComplete,
    PilotSessionOut,
    PilotFeedbackCreate,
    PilotFeedbackOut,
    PilotIssueCreate,
    PilotIssueOut,
    PilotDashboardResponse,
)
from app.services.pilot_service import pilot_service

router = APIRouter()


@router.post("/sessions", response_model=PilotSessionOut, status_code=status.HTTP_201_CREATED)
async def start_pilot_session(
    payload: PilotSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Starts a new pilot evaluation session for a scenario (e.g. scenario_a)."""
    session = await pilot_service.start_session(db, current_user.id, payload)
    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="PILOT_SESSION_STARTED",
        entity_type="PILOT_SESSION",
        entity_id=session.id,
        metadata={"scenario_id": payload.scenario_id, "customer_id": payload.customer_id},
    )
    return session


@router.post("/sessions/{id}/complete", response_model=PilotSessionOut)
async def complete_pilot_session(
    id: str,
    payload: PilotSessionComplete,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Completes a pilot evaluation session and records duration."""
    try:
        session = await pilot_service.complete_session(db, id, current_user.id, payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="PILOT_SESSION_COMPLETED",
        entity_type="PILOT_SESSION",
        entity_id=session.id,
        metadata={"duration_seconds": payload.time_taken_seconds, "status": payload.status},
    )
    return session


@router.get("/sessions", response_model=List[PilotSessionOut])
async def list_pilot_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Lists pilot sessions.
    Brokers see their own sessions; Managers and Admins see all sessions.
    """
    user_filter = current_user.id if current_user.role == "broker" else None
    return await pilot_service.list_sessions(db, user_id=user_filter)


@router.post("/sessions/{id}/feedback", response_model=PilotFeedbackOut, status_code=status.HTTP_201_CREATED)
async def submit_session_feedback(
    id: str,
    payload: PilotFeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submits Likert scale ratings (1-5) and qualitative feedback for a completed session."""
    feedback = await pilot_service.submit_feedback(db, current_user.id, payload, session_id=id)
    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="PILOT_FEEDBACK_SUBMITTED",
        entity_type="PILOT_FEEDBACK",
        entity_id=feedback.id,
        metadata={"scenario_id": payload.scenario_id, "rating_overall": payload.rating_overall},
    )
    return feedback


@router.post("/feedback", response_model=PilotFeedbackOut, status_code=status.HTTP_201_CREATED)
async def submit_standalone_feedback(
    payload: PilotFeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submits standalone pilot feedback without an explicit session."""
    feedback = await pilot_service.submit_feedback(db, current_user.id, payload, session_id=None)
    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="PILOT_FEEDBACK_SUBMITTED",
        entity_type="PILOT_FEEDBACK",
        entity_id=feedback.id,
        metadata={"scenario_id": payload.scenario_id, "rating_overall": payload.rating_overall},
    )
    return feedback


@router.post("/issues", response_model=PilotIssueOut, status_code=status.HTTP_201_CREATED)
async def report_pilot_issue(
    payload: PilotIssueCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Logs an issue or observation (P0/P1/P2) during pilot testing."""
    issue = await pilot_service.report_issue(db, current_user.id, payload)
    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="PILOT_ISSUE_REPORTED",
        entity_type="PILOT_ISSUE",
        entity_id=issue.id,
        metadata={"severity": payload.severity, "component": payload.component},
    )
    return issue


@router.get("/issues", response_model=List[PilotIssueOut])
async def list_pilot_issues(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lists all logged pilot issues."""
    return await pilot_service.list_issues(db)


@router.get("/dashboard", response_model=PilotDashboardResponse)
async def get_pilot_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns the unified Pilot Evaluation Dashboard.
    Provides technical KPIs, AI quality metrics, human feedback Likert stats, and scorecard.
    """
    return await pilot_service.get_dashboard(db)


@router.get("/metrics")
async def get_pilot_metrics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns technical and AI KPIs for pilot evaluation."""
    dashboard = await pilot_service.get_dashboard(db)
    return {
        "technical_kpis": dashboard.technical_kpis,
        "ai_quality_kpis": dashboard.ai_quality_kpis,
        "human_feedback": dashboard.human_feedback,
    }


@router.post("/freeze", tags=["pilot-evaluation"])
async def freeze_pilot_snapshot(
    label: str = "Pilot Sandbox Snapshot v1.0",
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """
    Creates an immutable, timestamped JSON snapshot of all pilot evaluation records.
    Requires admin privileges.
    """
    snapshot = await pilot_service.freeze_snapshot(db, current_user.id, label=label)
    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="PILOT_DATA_FROZEN",
        entity_type="PILOT_SNAPSHOT",
        entity_id=snapshot.snapshot_filename,
        metadata={"filename": snapshot.snapshot_filename, "total_sessions": snapshot.total_sessions},
    )
    return snapshot


import json
from fastapi.responses import Response
from app.services.pilot_analysis_service import pilot_analysis_service
from app.schemas.pilot_analysis import (
    PilotAnalysisSummaryResponse,
    LikertAnalysisReport,
    DecisionAnalysisReport,
    ScenarioAnalysisRow,
    EvidenceQualityRow,
)


@router.get("/snapshots", tags=["pilot-evaluation"])
async def list_pilot_snapshots(
    current_user: User = Depends(get_current_user),
):
    """Lists all frozen snapshot filenames."""
    return {"snapshots": pilot_service.list_snapshots()}


# ── Pilot Evidence Analysis & Validation Endpoints (Phase 32) ──
@router.get("/analysis", response_model=PilotAnalysisSummaryResponse, tags=["pilot-analysis"])
async def get_pilot_analysis(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns the comprehensive, validated pilot evidence analysis report.
    Evaluates data quality, Likert distribution, scenario breakdown, and evidence status.
    """
    return await pilot_analysis_service.get_full_analysis(db)


@router.get("/analysis/likert", response_model=LikertAnalysisReport, tags=["pilot-analysis"])
async def get_likert_analysis(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns descriptive statistics and 1-5 score distributions for Likert questions."""
    return await pilot_analysis_service.analyze_likert(db)


@router.get("/analysis/scenarios", response_model=List[ScenarioAnalysisRow], tags=["pilot-analysis"])
async def get_scenarios_analysis(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns scenario-by-scenario completions, duration metrics, and decision breakdowns."""
    return await pilot_analysis_service.analyze_scenarios(db)


@router.get("/analysis/decisions", response_model=DecisionAnalysisReport, tags=["pilot-analysis"])
async def get_decisions_analysis(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns broker decision action distributions and structured override reasons."""
    return await pilot_analysis_service.analyze_decisions(db)


@router.get("/analysis/evidence", response_model=List[EvidenceQualityRow], tags=["pilot-analysis"])
async def get_evidence_scorecard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns the evidence quality scorecard across 9 domains."""
    analysis = await pilot_analysis_service.get_full_analysis(db)
    return analysis.evidence_scorecard


@router.get("/analysis/export", tags=["pilot-analysis"])
async def export_pilot_analysis(
    format: str = "json",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Exports validated aggregate pilot evidence in JSON or CSV format without PII."""
    if format.lower() == "csv":
        csv_data = await pilot_analysis_service.export_analysis_csv(db)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="pilot_evidence_analysis.csv"'},
        )
    
    analysis = await pilot_analysis_service.get_full_analysis(db)
    return Response(
        content=json.dumps(analysis.model_dump(), indent=2, ensure_ascii=False),
        media_type="application/json",
        headers={"Content-Disposition": 'attachment; filename="pilot_evidence_analysis.json"'},
    )

