"""
Model Monitoring and Feedback Router.
Provides actual evaluation metrics, model versioning, operational stats, and feedback collection endpoints.
"""
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.core.audit import log_audit_event
from app.models.user import User
from app.models.customer import Customer
from app.models.ai_score import AIScore
from app.models.model_feedback import ModelFeedback
from app.services.monitoring_service import monitoring_service
from app.schemas.model_monitoring import (
    ModelMetricsResponse,
    ModelVersionsResponse,
    ModelMonitoringStatsResponse,
    ModelFeedbackCreate,
    ModelFeedbackOut,
    ModelFeedbackListResponse,
    ModelComparisonResponse,
    CalibrationMetricsResponse,
    FairnessReportResponse,
    LLMEvaluationReportResponse,
    ModelRegistryResponse,
    ModelPromotionRequest,
    ModelPromotionResponse,
    ModelRollbackRequest,
    ModelDriftReportResponse,
    ModelEvidenceSummaryResponse,
    ErrorAnalysisResponse,
    ThresholdAnalysisResponse,
    FeatureAnalysisResponse,
    LatencyBenchmarkResponse,
    LLMPerformanceResponse,
    E2EPerformanceResponse,
)

router = APIRouter()


@router.get("/e2e-performance", response_model=E2EPerformanceResponse)
async def get_e2e_performance(
    current_user: User = Depends(get_current_user),
):
    """
    Returns live End-to-End system workflow performance, component latency breakdown (DB, ML, SHAP, LLM, Rec),
    percentiles (P50, P95, P99), concurrency scaling, and performance budget compliance (Phase 27).
    """
    return monitoring_service.get_e2e_performance_metrics()


@router.get("/llm-performance", response_model=LLMPerformanceResponse)
async def get_llm_performance(
    current_user: User = Depends(get_current_user),
):
    """
    Returns live LLM performance, latency percentiles, token consumption,
    cache hit rate, cost estimation, and Baseline vs Optimized benchmark metrics (Phase 25).
    """
    return monitoring_service.get_llm_performance_metrics()


@router.get("/evidence", response_model=ModelEvidenceSummaryResponse)
async def get_model_evidence_summary(
    current_user: User = Depends(get_current_user),
):
    """
    Returns consolidated executive AI performance & evidence summary
    (Baseline metrics, Platt calibration, Reliability, Latency breakdown, Candidate comparison, and System Quality).
    """
    return monitoring_service.get_evidence_summary()


@router.get("/errors", response_model=ErrorAnalysisResponse)
async def get_error_analysis(
    current_user: User = Depends(get_current_user),
):
    """
    Returns empirical error analysis (Confusion Breakdown, Misclassified Customer Feature Profiles,
    Score-band concentrations, and Representative synthetic FP/FN samples).
    """
    return monitoring_service.get_error_analysis()


@router.get("/threshold-analysis", response_model=ThresholdAnalysisResponse)
async def get_threshold_analysis(
    current_user: User = Depends(get_current_user),
):
    """
    Returns 5-Fold Cross-Validation threshold grid (0.10 to 0.90),
    trade-off selection rationale, and final holdout evaluation at the chosen threshold.
    """
    return monitoring_service.get_threshold_analysis()


@router.get("/features", response_model=FeatureAnalysisResponse)
async def get_feature_analysis(
    current_user: User = Depends(get_current_user),
):
    """
    Returns Feature Importances (Tree Splits & SHAP values)
    and 4 Feature Ablation experiments verifying the impact of engagement vs static balance sheet features.
    """
    return monitoring_service.get_feature_analysis()


@router.get("/latency", response_model=LatencyBenchmarkResponse)
async def get_latency_benchmark(
    current_user: User = Depends(get_current_user),
):
    """
    Returns single-sample prediction latency (LightGBM vs SHAP TreeExplainer overhead in ms).
    """
    return monitoring_service.get_latency_benchmark()


@router.get("/registry", response_model=ModelRegistryResponse)
async def get_model_registry(
    current_user: User = Depends(get_current_user),
):
    """
    Returns full MLOps Model Registry catalog tracking all model versions,
    validation statuses (candidate, validated, active, archived), and reproducibility provenance.
    """
    return monitoring_service.get_model_registry()


@router.post("/promote", response_model=ModelPromotionResponse)
async def promote_model_version(
    payload: ModelPromotionRequest,
    current_user: User = Depends(require_role("admin")),
):
    """
    Admin-only: Promotes a VALIDATED model version to active champion.
    Strict constraint: Unvalidated models cannot be activated.
    """
    success, msg = monitoring_service.promote_model(payload.version)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
        )
    return ModelPromotionResponse(
        success=True,
        message=msg,
        active_version=payload.version,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.post("/rollback", response_model=ModelPromotionResponse)
async def rollback_model_version(
    payload: ModelRollbackRequest,
    current_user: User = Depends(require_role("admin")),
):
    """
    Admin-only: Rolls back the active champion model to a specified previous validated version.
    """
    success, msg = monitoring_service.rollback_model(payload.target_version)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
        )
    return ModelPromotionResponse(
        success=True,
        message=msg,
        active_version=payload.target_version,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/drift", response_model=ModelDriftReportResponse)
async def get_model_drift(
    current_user: User = Depends(get_current_user),
):
    """
    Returns Population Stability Index (PSI) drift report comparing baseline feature & prediction distributions
    against current production inference data.
    """
    return monitoring_service.get_drift_report()


@router.get("/llm-evaluation", response_model=LLMEvaluationReportResponse)
async def get_llm_evaluation(
    current_user: User = Depends(get_current_user),
):
    """
    Returns reproducible LLM output evaluation report across Groundedness, Relevance,
    Safety, Uncertainty Handling, and Schema Completeness on synthetic benchmark customer scenarios.
    """
    return monitoring_service.get_llm_evaluation_report()


@router.get("/fairness", response_model=FairnessReportResponse)
async def get_model_fairness(
    current_user: User = Depends(get_current_user),
):
    """
    Returns demographic fairness and bias audit report (Precision, Recall, F1, FPR, FNR across subgroups,
    small sample flags, and feature classification separating model features from audit-only attributes).
    """
    return monitoring_service.get_fairness_report()


@router.get("/calibration", response_model=CalibrationMetricsResponse)
async def get_model_calibration(
    current_user: User = Depends(get_current_user),
):
    """
    Returns probability calibration evaluation (Brier Score, ECE, LogLoss, Calibration Curves,
    and Operating Score Thresholds) for Platt Sigmoid scaling vs. Uncalibrated model.
    """
    return monitoring_service.get_model_calibration()


@router.get("/benchmark", response_model=ModelComparisonResponse)
async def get_model_benchmarks(
    current_user: User = Depends(get_current_user),
):
    """
    Returns empirical benchmarks comparing baseline models
    (Logistic Regression, Random Forest, LightGBM) evaluated with 5-Fold Stratified Cross-Validation.
    """
    return monitoring_service.get_model_benchmarks()


@router.get("/metrics", response_model=ModelMetricsResponse)
async def get_model_metrics(
    current_user: User = Depends(get_current_user),
):
    """
    Returns actual evaluation metrics produced by the ML pipeline
    (Precision, Recall, F1, ROC-AUC, Confusion Matrix, and feature columns).
    Explicitly labeled as Synthetic Demo Dataset Evaluation.
    """
    return monitoring_service.get_model_metrics()


@router.get("/versions", response_model=ModelVersionsResponse)
async def get_model_versions(
    current_user: User = Depends(get_current_user),
):
    """Returns active and historical model version catalog."""
    return monitoring_service.get_model_versions()


@router.get("/monitoring", response_model=ModelMonitoringStatsResponse)
async def get_monitoring_statistics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Aggregates live operational statistics:
    Prediction volume, priority distributions, average score, broker acceptance/override rate,
    and feedback distributions.
    """
    return await monitoring_service.get_monitoring_stats(db)


@router.post("/feedback", response_model=ModelFeedbackOut, status_code=status.HTTP_201_CREATED)
async def submit_model_feedback(
    body: ModelFeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Captures broker feedback on an AI model prediction (useful, not_useful, incorrect, needs_review).
    Stores structured reason and audit trail.
    """
    # Verify customer exists
    cust_res = await db.execute(select(Customer.id).where(Customer.id == body.customer_id))
    if not cust_res.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Customer '{body.customer_id}' not found")

    feedback = ModelFeedback(
        customer_id=body.customer_id,
        broker_id=current_user.id,
        prediction_id=body.prediction_id,
        feedback_type=body.feedback_type.lower(),
        reason=body.reason,
        comments=body.comments,
        created_at=datetime.now(timezone.utc),
    )
    db.add(feedback)
    await db.flush()

    # Log audit event
    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="MODEL_FEEDBACK_SUBMITTED",
        entity_type="MODEL_FEEDBACK",
        entity_id=feedback.id,
        metadata={
            "customer_id": body.customer_id,
            "feedback_type": body.feedback_type.lower(),
            "reason": body.reason,
        },
    )
    await db.commit()

    return ModelFeedbackOut(
        id=feedback.id,
        customer_id=feedback.customer_id,
        broker_id=feedback.broker_id,
        broker_name=current_user.full_name,
        prediction_id=feedback.prediction_id,
        feedback_type=feedback.feedback_type,
        reason=feedback.reason,
        comments=feedback.comments,
        created_at=feedback.created_at,
    )


@router.get("/feedback", response_model=ModelFeedbackListResponse)
async def list_model_feedback(
    customer_id: Optional[str] = Query(None, description="Filter by customer ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List collected broker feedback items with broker metadata."""
    stmt = (
        select(ModelFeedback)
        .options(selectinload(ModelFeedback.broker))
        .order_by(desc(ModelFeedback.created_at))
    )
    if customer_id:
        stmt = stmt.where(ModelFeedback.customer_id == customer_id)

    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)

    result = await db.execute(stmt)
    feedbacks = result.scalars().all()

    items = [
        ModelFeedbackOut(
            id=f.id,
            customer_id=f.customer_id,
            broker_id=f.broker_id,
            broker_name=f.broker.full_name if f.broker else "Unknown",
            prediction_id=f.prediction_id,
            feedback_type=f.feedback_type,
            reason=f.reason,
            comments=f.comments,
            created_at=f.created_at,
        )
        for f in feedbacks
    ]

    return ModelFeedbackListResponse(items=items, total=len(items))
