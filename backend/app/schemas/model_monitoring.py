"""Pydantic schemas for Model Monitoring, Metrics, Versions, and Broker Feedback."""
from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict


class EvaluationMetricDetail(BaseModel):
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    accuracy: float
    sample_count: int
    dataset_type: str = "Synthetic Demo Dataset Evaluation"
    confusion_matrix: Optional[Dict[str, Any]] = None


class ModelMetricsResponse(BaseModel):
    model_name: str
    model_version: str
    dataset_label: str = "Synthetic Demo Dataset Evaluation"
    metrics: EvaluationMetricDetail
    features_used: List[str]
    disclaimer: str = "Trained and evaluated on synthetic demonstration data. Not real Krungsri production system."
    evaluated_at: str


class ModelVersionItem(BaseModel):
    version: str
    model_name: str
    status: str  # "active", "candidate", "deprecated"
    trained_at: Optional[str] = None
    accuracy: Optional[float] = None
    f1_score: Optional[float] = None
    is_default: bool = False


class ModelVersionsResponse(BaseModel):
    active_version: str
    versions: List[ModelVersionItem]


class ScoreDistributionItem(BaseModel):
    bucket: str
    count: int
    percentage: float


class ModelMonitoringStatsResponse(BaseModel):
    model_name: str
    active_version: str
    total_predictions: int
    predictions_by_priority: Dict[str, int]
    predictions_by_version: Dict[str, int]
    average_score: float
    feedback_summary: Dict[str, int]
    broker_acceptance_rate: float  # percentage of recommendations accepted
    broker_override_rate: float    # percentage modified or declined
    total_decisions_recorded: int
    score_distribution: List[ScoreDistributionItem]
    as_of: str


class ModelFeedbackCreate(BaseModel):
    prediction_id: Optional[str] = None
    customer_id: str
    feedback_type: str = Field(..., description="useful, not_useful, incorrect, needs_review")
    reason: Optional[str] = Field(None, description="accurate_priority, overestimated, underestimated, financial_changed, other")
    comments: Optional[str] = None


class ModelFeedbackOut(BaseModel):
    id: str
    customer_id: str
    broker_id: str
    broker_name: Optional[str] = None
    prediction_id: Optional[str] = None
    feedback_type: str
    reason: Optional[str] = None
    comments: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ModelFeedbackListResponse(BaseModel):
    items: List[ModelFeedbackOut]
    total: int


# ── Phase 14 Model Benchmark Schemas ──

class CrossValidationMetrics(BaseModel):
    cv_accuracy_mean: float
    cv_accuracy_std: float
    cv_precision_mean: float
    cv_precision_std: float
    cv_recall_mean: float
    cv_recall_std: float
    cv_f1_mean: float
    cv_f1_std: float
    cv_roc_auc_mean: float
    cv_roc_auc_std: float


class ModelBenchmarkItem(BaseModel):
    model_id: str
    model_name: str
    hyperparameters: Dict[str, Any]
    test_metrics: Dict[str, float]
    cross_validation_5fold: CrossValidationMetrics
    confusion_matrix: Dict[str, Any]
    is_champion: bool = False


class DatasetBenchmarkMetadata(BaseModel):
    total_samples: int
    train_samples: int
    test_samples: int
    num_features: int
    class_distribution: Dict[str, Any]
    features_used: List[str]
    is_synthetic: bool = True
    evaluation_notice: str


class ChampionModelSummary(BaseModel):
    model_id: str
    model_name: str
    selection_criteria: str
    test_f1: float
    test_roc_auc: float
    test_precision: float
    test_recall: float


class ModelComparisonResponse(BaseModel):
    benchmark_id: str
    evaluated_at: str
    dataset_metadata: DatasetBenchmarkMetadata
    models: List[ModelBenchmarkItem]
    champion_model: ChampionModelSummary


# ── Phase 15 Probability Calibration Schemas ──

class CalibrationCurvePoint(BaseModel):
    mean_predicted_probability: float
    fraction_of_positives: float


class CalibrationMethodMetrics(BaseModel):
    brier_score: float
    log_loss: float
    expected_calibration_error: float
    calibration_curve: List[CalibrationCurvePoint] = []


class CalibrationMethodItem(BaseModel):
    method_name: str
    metrics: CalibrationMethodMetrics
    is_selected: bool = False


class ScoreThresholdTier(BaseModel):
    score_range: str
    priority: str
    sample_count: int
    sample_percentage: float
    actual_high_priority_count: int
    operational_guidance: str
    precision: Optional[float] = None
    recall: Optional[float] = None
    false_negative_rate: Optional[float] = None
    positive_rate: Optional[float] = None


class CalibrationMetricsResponse(BaseModel):
    calibration_id: str
    selected_method: str
    method_rationale: str
    dataset_metadata: Dict[str, Any]
    methods_comparison: Dict[str, CalibrationMethodItem]
    score_thresholds: Dict[str, ScoreThresholdTier]
    explanation: str
    created_at: str


# ── Phase 16 Fairness and Bias Analysis Schemas ──

class SubgroupMetricItem(BaseModel):
    group_name: str
    sample_count: int
    sample_percentage: float
    positive_count: int
    positive_rate: float
    precision: float
    recall: float
    f1_score: float
    false_positive_rate: float
    false_negative_rate: float
    is_small_sample: bool
    sample_warning: Optional[str] = None


class SubgroupAnalysisCategory(BaseModel):
    attribute: str
    description: str
    is_model_feature: bool
    groups: List[SubgroupMetricItem]
    max_recall_disparity: float


class FairnessReportResponse(BaseModel):
    audit_id: str
    evaluated_at: str
    model_name: str
    model_version: str
    dataset_metadata: Dict[str, Any]
    feature_classification: Dict[str, List[str]]
    prediction_feature_count: int
    prediction_features: List[str]
    subgroup_analyses: Dict[str, SubgroupAnalysisCategory]
    key_observations: List[str]
    limitations_and_disclaimer: str


# ── Phase 17 LLM Output Evaluation Schemas ──

class LLMEvalBenchmarkCase(BaseModel):
    case_id: str
    scenario_name: str
    customer_ref: Optional[str] = None
    customer_name: Optional[str] = None
    dimension_scores: Dict[str, int]
    overall_score: float
    passed: bool
    safety_violations: List[str]
    hallucinations: List[str]
    evaluator_notes: List[str]
    generated_insight_summary: str
    generated_conv_opening: str


class LLMEvalRegressionTracking(BaseModel):
    baseline_date: str
    previous_run_score: float
    target_threshold_score: float
    status: str


class LLMEvaluationReportResponse(BaseModel):
    evaluation_id: str
    evaluated_at: str
    prompt_version: str
    dataset_version: str
    llm_provider: str
    total_scenarios: int
    overall_average_rubric_score: float
    max_possible_rubric_score: float
    pass_rate_percentage: float
    failure_count: int
    safety_issue_count: int
    hallucination_count: int
    dimension_performance: Dict[str, float]
    scoring_rubric_guide: Dict[str, Any]
    benchmark_cases: List[LLMEvalBenchmarkCase]
    regression_baseline_tracking: LLMEvalRegressionTracking
    disclaimer: str


# ── Phase 19 MLOps Model Registry & Drift Monitoring Schemas ──

class ModelProvenanceOut(BaseModel):
    random_seed: int = 42
    dataset_records: int = 1200
    feature_count: int = 17
    hyperparameters: Dict[str, Any]
    environment: Dict[str, str]


class ModelRegistryItemOut(BaseModel):
    version: str
    model_name: str
    status: str  # "candidate" | "validated" | "active" | "archived"
    deployment_status: str  # "deployed" | "staged" | "deprecated"
    is_active: bool
    created_at: str
    training_dataset_version: str
    feature_version: str
    metrics: Dict[str, float]
    provenance: ModelProvenanceOut
    description: Optional[str] = None


class ModelRegistryResponse(BaseModel):
    registry_version: str
    active_version: str
    updated_at: str
    models: List[ModelRegistryItemOut]


class ModelPromotionRequest(BaseModel):
    version: str


class ModelPromotionResponse(BaseModel):
    success: bool
    message: str
    active_version: str
    timestamp: str


class ModelRollbackRequest(BaseModel):
    target_version: str


class FeatureDriftItem(BaseModel):
    feature_name: str
    thai_label: str
    psi_score: float
    status: str  # "stable" | "moderate_drift" | "significant_drift"
    baseline_mean: float
    current_mean: float
    baseline_std: float
    current_std: float
    bin_breakdown: List[Dict[str, Any]]


class PredictionDriftItem(BaseModel):
    metric_name: str
    psi_score: float
    status: str
    baseline_high_priority_rate: float
    current_high_priority_rate: float


class ModelDriftReportResponse(BaseModel):
    report_id: str
    evaluated_at: str
    baseline_sample_count: int
    current_sample_count: int
    is_small_sample: bool
    sample_warning: Optional[str] = None
    overall_data_drift_status: str
    feature_drifts: List[FeatureDriftItem]
    prediction_drift: PredictionDriftItem
    drift_interpretation_guide: Dict[str, str]
    recommendations: List[str]


# ── Phase 24 AI Performance & Evidence Dashboard Schemas ──

class ErrorAnalysisResponse(BaseModel):
    total_test_samples: int
    confusion_breakdown: Dict[str, int]
    overall_error_count: int
    overall_error_rate: float
    group_feature_profiles: Dict[str, Dict[str, float]]
    score_band_error_concentration: Dict[str, Dict[str, Any]]
    representative_false_positives: List[Dict[str, Any]]
    representative_false_negatives: List[Dict[str, Any]]


class ThresholdAnalysisResponse(BaseModel):
    cv_grid_results: List[Dict[str, Any]]
    selected_threshold: float
    selection_rationale: str
    holdout_test_result_at_selected_threshold: Dict[str, Any]


class FeatureAnalysisResponse(BaseModel):
    feature_split_importance: List[Dict[str, Any]]
    feature_shap_importance: List[Dict[str, Any]]
    ablation_experiments: Dict[str, Dict[str, Any]]


class LatencyBenchmarkResponse(BaseModel):
    benchmark_iterations: int
    single_sample_prediction_latency_ms: float
    single_sample_shap_latency_ms: float
    total_combined_inference_latency_ms: float
    shap_overhead_percentage: float


class ModelEvidenceSummaryResponse(BaseModel):
    active_champion: str
    model_version: str
    dataset_version: str
    dataset_type: str = "Synthetic Demo Dataset (Holdout Test Set N=240)"
    evaluated_at: str
    metrics: Dict[str, float]
    calibration: Dict[str, float]
    reliability: Dict[str, Any]
    latency: Dict[str, float]
    governance: Dict[str, Any]
    candidate_comparison: List[Dict[str, Any]]
    system_quality: Dict[str, Any]


# ── Phase 25 LLM Cost, Latency & Optimization Schemas ──

class LLMPerformanceResponse(BaseModel):
    active_model: str
    active_prompt_version: str
    optimization_status: str
    total_requests: int
    avg_latency_ms: float
    p95_latency_ms: float
    avg_input_tokens: float
    avg_output_tokens: float
    avg_total_tokens: float
    cache_hit_rate: float
    fallback_rate: float
    guardrail_rejection_rate: float
    estimated_cost_per_1k_requests_usd: float
    pricing_rates: Dict[str, float]
    cache_metrics: Dict[str, Any]
    baseline_vs_optimized: Dict[str, Any]


# ── Phase 27 End-to-End Performance & Benchmarking Schemas ──

class E2EPerformanceResponse(BaseModel):
    benchmark_name: str
    status: str
    timestamp: str
    environment: str
    workflow_summary: Dict[str, Any]
    component_breakdown: Dict[str, Any]
    steps_cold: List[Dict[str, Any]]
    steps_warm: List[Dict[str, Any]]
    concurrency_scaling: List[Dict[str, Any]]
    bottleneck_ranking: List[Dict[str, Any]]
    performance_budgets: List[Dict[str, Any]]



