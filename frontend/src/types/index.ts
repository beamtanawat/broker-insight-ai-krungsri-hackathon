// Shared TypeScript types for Broker Insight AI (Krungsri Hackathon Prototype)

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "broker" | "manager" | "admin";
  is_active: boolean;
}

export interface PriorityBreakdown {
  high: number;
  medium: number;
  low: number;
  unscored: number;
}

export interface KYCBreakdown {
  verified: number;
  pending: number;
  rejected: number;
}

export interface DashboardSummary {
  total_customers: number;
  priority_breakdown: PriorityBreakdown;
  overdue_followups_count: number;
  open_followups_count: number;
  kyc_breakdown: KYCBreakdown;
  total_active_policies: number;
  total_coverage_amount: number;
  total_products_available: number;
  as_of: string;
}

export interface CustomerListItem {
  id: string;
  external_ref: string;
  full_name: string;
  kyc_status: "verified" | "pending" | "rejected";
  relationship_tier?: string;
  score_display: number | null;
  priority_level: "high" | "medium" | "low" | null;
  score_short_reason: string | null;
  why_now?: string | null;
  recommended_action?: string | null;
  action_state?: "action" | "review" | "no_action" | null;
  active_policies_count: number;
  has_overdue_followup: boolean;
}

export interface CustomerProfile {
  id: string;
  customer_id: string;
  age: number | null;
  gender: string | null;
  occupation: string | null;
  income_range: string | null;
  kyc_status: "verified" | "pending" | "rejected";
  kyc_channel: string | null;
  risk_tolerance: string | null;
  relationship_tier: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialProfile {
  id: string;
  customer_id: string;
  total_assets: number;
  total_liabilities: number;
  monthly_savings: number;
  has_active_loan: boolean;
  loan_details: string | null;
  products_held: string[];
  transaction_frequency_90d: number;
  last_financial_activity: string | null;
}

export interface InsurancePolicy {
  id: string;
  customer_id: string;
  policy_number: string;
  policy_type: string;
  coverage_amount: number;
  premium_amount: number;
  start_date: string | null;
  renewal_date: string | null;
  status: string;
  payment_status: string;
  remarks: string | null;
}

export interface AIScoreSummary {
  id: string;
  score: number;
  score_display: number;
  raw_probability?: number;
  calibrated_probability?: number;
  priority?: "high" | "medium" | "low";
  priority_level: "high" | "medium" | "low";
  calibration_method?: string;
  feature_importance: SHAPFactor[];
  scored_at: string;
  model_version: string;
}

export interface CustomerNeed {
  id: string;
  need_type: string;
  severity: string;
  description: string;
  identified_at: string;
}

export interface FollowUpSummary {
  id: string;
  scheduled_date: string | null;
  last_contact_date: string | null;
  follow_up_window: string | null;
  status: "open" | "done" | "snoozed";
  priority: string;
  payment_status: "paid" | "overdue" | "pending";
  notes: string | null;
}

export interface CustomerDetail {
  id: string;
  external_ref: string;
  first_name: string;
  last_name: string;
  full_name: string;
  assigned_broker_id: string | null;
  created_at: string;
  updated_at: string;
  profile: CustomerProfile | null;
  financial_profile: FinancialProfile | null;
  insurance_policies: InsurancePolicy[];
  latest_score: AIScoreSummary | null;
  needs: CustomerNeed[];
  follow_ups: FollowUpSummary[];
}

export interface CustomerFullProfile {
  customer_id: string;
  external_ref: string;
  full_name: string;
  profile: CustomerProfile | null;
  financial_profile: FinancialProfile | null;
  active_policies: InsurancePolicy[];
  total_coverage: number;
}

export interface SHAPFactor {
  feature: string;
  label: string;
  value: number;
  shap_value: number;
  importance: number;
  impact: "positive" | "negative";
}

export interface ModelMetadata {
  model_name: string;
  model_version: string;
  timestamp: string;
  disclaimer: string;
}

export interface AnalyzeCustomerResponse {
  customer_id: string;
  external_ref: string;
  full_name: string;
  score: number;
  probability: number;
  raw_probability: number;
  calibrated_probability: number;
  priority: "high" | "medium" | "low";
  priority_level: "high" | "medium" | "low";
  calibration_method?: string;
  calibration_explanation?: string;
  factors: SHAPFactor[];
  model_metadata: ModelMetadata;
  features_used: Record<string, number>;
}

// ── Phase 6 Specific Types ──
export interface LLMInsightResponse {
  customer_id: string;
  customer_summary: string;
  key_observations: string[];
  potential_needs: string[];
  conversation_topics: string[];
  cautions: string[];
  provider: string;
  model_version: string;
  generated_at: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
}

export interface NeedCategoryScore {
  category: string;
  label_th: string;
  score: number;
  severity: "high" | "medium" | "low" | "none";
  supporting_signals: string[];
  explanation: string;
}

export interface CustomerNeedAnalysisResponse {
  customer_id: string;
  external_ref: string;
  full_name: string;
  overall_need_summary: string;
  needs: NeedCategoryScore[];
  evaluated_at: string;
  disclaimer: string;
}

export interface StructuredExplanation {
  need_signal: string;
  profile_fit: string;
  eligibility_result: string;
  existing_coverage_assessment: string;
}

export interface ProductMatchOut {
  recommendation_id?: string | null;
  product_id: string;
  product_code: string;
  product_name: string;
  category: string;
  match_score: number;
  eligibility_status: "eligible" | "needs_verification" | "partial" | "ineligible" | string;
  reasons: string[];
  unmet_criteria: string[];
  coverage_range: string;
  status: "proposed" | "accepted" | "modified" | "declined" | string;
  priority_rank: number;
  confidence_level?: "high" | "medium" | "low" | string;
  missing_information?: string[];
  structured_explanation?: StructuredExplanation;
  rank_rationale?: string;
  estimated_premium_annual?: number;
}

export interface CustomerRecommendationsResponse {
  customer_id: string;
  external_ref: string;
  full_name: string;
  recommendations: ProductMatchOut[];
  generated_at: string;
  disclaimer: string;
}

export interface BrokerDecisionOut {
  id: string;
  customer_id: string;
  recommendation_id: string | null;
  product_id?: string | null;
  action_taken: "approve" | "modify" | "reject" | string;
  reason?: string | null;
  ai_recommendation?: string | null;
  feedback: string | null;
  decision_date: string;
  broker_id: string;
  broker_name?: string | null;
}

export interface RecommendationAnalyticsResponse {
  total_recommendations: number;
  total_decisions: number;
  approval_count: number;
  approval_rate: number;
  modification_count: number;
  modification_rate: number;
  rejection_count: number;
  rejection_rate: number;
  recommendations_by_category: Record<string, number>;
  common_modification_reasons: Record<string, number>;
  common_rejection_reasons: Record<string, number>;
  common_approval_reasons: Record<string, number>;
  as_of: string;
}

// ── Phase 7 Specific Types ──
export interface ModelTraceabilityOut {
  model_name: string;
  model_version: string;
  timestamp: string;
  provider: string;
  disclaimer: string;
}

export interface ConversationAssistantResponse {
  customer_id: string;
  customer_name: string;
  external_ref: string;
  conversation_objective: string;
  suggested_opening: string;
  suggested_questions: string[];
  topics_to_explore: string[];
  potential_concerns: string[];
  follow_up_questions: string[];
  model_metadata: ModelTraceabilityOut;
}

export interface FollowUpCreate {
  scheduled_date?: string | null;
  follow_up_window?: string;
  status?: "open" | "done" | "snoozed";
  priority?: "high" | "medium" | "low";
  payment_status?: "paid" | "overdue" | "pending";
  notes?: string;
}

export interface AuditLogOut {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, any>;
  timestamp: string;
  user_name?: string | null;
}

export interface CustomerAuditHistoryResponse {
  customer_id: string;
  total_events: number;
  events: AuditLogOut[];
}

// ── Phase 10 Specific Types (Model Monitoring & Feedback) ──
export interface EvaluationMetricDetail {
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  accuracy: number;
  sample_count: number;
  dataset_type: string;
  confusion_matrix?: {
    true_negative: number;
    false_positive: number;
    false_negative: number;
    true_positive: number;
    matrix_raw: number[][];
  };
}

export interface ModelMetricsResponse {
  model_name: string;
  model_version: string;
  dataset_label: string;
  metrics: EvaluationMetricDetail;
  features_used: string[];
  disclaimer: string;
  evaluated_at: string;
}

export interface ModelVersionItem {
  version: string;
  model_name: string;
  status: "active" | "candidate" | "deprecated" | string;
  trained_at: string | null;
  accuracy: number | null;
  f1_score: number | null;
  is_default: boolean;
}

export interface ModelVersionsResponse {
  active_version: string;
  versions: ModelVersionItem[];
}

export interface ScoreDistributionItem {
  bucket: string;
  count: number;
  percentage: number;
}

export interface ModelMonitoringStatsResponse {
  model_name: string;
  active_version: string;
  total_predictions: number;
  predictions_by_priority: Record<string, number>;
  predictions_by_version: Record<string, number>;
  average_score: number;
  feedback_summary: {
    useful: number;
    not_useful: number;
    incorrect: number;
    needs_review: number;
  };
  broker_acceptance_rate: number;
  broker_override_rate: number;
  total_decisions_recorded: number;
  score_distribution: ScoreDistributionItem[];
  as_of: string;
}

export interface ModelFeedbackCreate {
  customer_id: string;
  prediction_id?: string | null;
  feedback_type: "useful" | "not_useful" | "incorrect" | "needs_review";
  reason?: string | null;
  comments?: string | null;
}

export interface ModelFeedbackOut {
  id: string;
  customer_id: string;
  broker_id: string;
  broker_name?: string | null;
  prediction_id?: string | null;
  feedback_type: string;
  reason?: string | null;
  comments?: string | null;
  created_at: string;
}

export interface FollowUp {
  id: string;
  customer_id: string;
  broker_id: string;
  renewal_date: string | null;
  last_contact_date: string | null;
  payment_status: "paid" | "overdue" | "pending";
  follow_up_window: string | null;
  engagement_status: string | null;
  notes: string | null;
  status: "open" | "done" | "snoozed";
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

// ── Phase 12 Specific Types (Advanced Broker & Manager Analytics) ──
export interface AnalyticsOverviewResponse {
  role_scope: "broker" | "manager" | "admin" | string;
  user_name: string;
  total_customers: number;
  high_priority_customers: number;
  medium_priority_customers: number;
  low_priority_customers: number;
  follow_ups_due: number;
  follow_ups_completed: number;
  follow_ups_overdue: number;
  ai_analysis_count: number;
  recommendation_count: number;
  approval_rate: number;
  modification_rate: number;
  rejection_rate: number;
  as_of: string;
}

export interface PriorityTrendItem {
  period: string;
  high: number;
  medium: number;
  low: number;
}

export interface PriorityAnalyticsResponse {
  role_scope: string;
  total_scored_customers: number;
  priority_distribution: Record<string, number>;
  average_priority_score: number;
  score_distribution: ScoreDistributionItem[];
  priority_trends: PriorityTrendItem[];
  as_of: string;
}

export interface NeedCategoryDistributionItem {
  category: string;
  label_th: string;
  count: number;
  percentage: number;
}

export interface NeedAnalyticsResponse {
  role_scope: string;
  total_needs_identified: number;
  categories_distribution: NeedCategoryDistributionItem[];
  top_identified_needs: { description: string; count: number }[];
  as_of: string;
}

export interface FollowUpAnalyticsResponse {
  role_scope: string;
  total_follow_ups: number;
  due_count: number;
  completed_count: number;
  overdue_count: number;
  upcoming_count: number;
  status_distribution: Record<string, number>;
  payment_status_distribution: Record<string, number>;
  as_of: string;
}

export interface AIUsageAnalyticsResponse {
  role_scope: string;
  active_model_version: string;
  model_name: string;
  total_ai_scoring_requests: number;
  total_llm_insight_requests: number;
  total_conversation_requests: number;
  total_feedback_recorded: number;
  feedback_breakdown: Record<string, number>;
  as_of: string;
}

export type PriorityLevel = "high" | "medium" | "low";

// ── Phase 14 ML Benchmarking Types ──
export interface CrossValidationMetrics {
  cv_accuracy_mean: number;
  cv_accuracy_std: number;
  cv_precision_mean: number;
  cv_precision_std: number;
  cv_recall_mean: number;
  cv_recall_std: number;
  cv_f1_mean: number;
  cv_f1_std: number;
  cv_roc_auc_mean: number;
  cv_roc_auc_std: number;
}

export interface ModelBenchmarkItem {
  model_id: string;
  model_name: string;
  hyperparameters: Record<string, any>;
  test_metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
  };
  cross_validation_5fold: CrossValidationMetrics;
  confusion_matrix: {
    true_negative: number;
    false_positive: number;
    false_negative: number;
    true_positive: number;
    raw_matrix: number[][];
  };
  is_champion: boolean;
}

export interface DatasetBenchmarkMetadata {
  total_samples: number;
  train_samples: number;
  test_samples: number;
  num_features: number;
  class_distribution: {
    positive_high_priority: number;
    negative_standard_priority: number;
    positive_percentage: number;
  };
  features_used: string[];
  is_synthetic: boolean;
  evaluation_notice: string;
}

export interface ChampionModelSummary {
  model_id: string;
  model_name: string;
  selection_criteria: string;
  test_f1: number;
  test_roc_auc: number;
  test_precision: number;
  test_recall: number;
}

export interface ModelComparisonResponse {
  benchmark_id: string;
  evaluated_at: string;
  dataset_metadata: DatasetBenchmarkMetadata;
  models: ModelBenchmarkItem[];
  champion_model: ChampionModelSummary;
}

// ── Phase 15 Probability Calibration Types ──
export interface CalibrationCurvePoint {
  mean_predicted_probability: number;
  fraction_of_positives: number;
}

export interface CalibrationMethodMetrics {
  brier_score: number;
  log_loss: number;
  expected_calibration_error: number;
  calibration_curve: CalibrationCurvePoint[];
}

export interface CalibrationMethodItem {
  method_name: string;
  metrics: CalibrationMethodMetrics;
  is_selected?: boolean;
}

export interface ScoreThresholdTier {
  score_range: string;
  priority: string;
  sample_count: number;
  sample_percentage: number;
  actual_high_priority_count: number;
  operational_guidance: string;
  precision?: number;
  recall?: number;
  false_negative_rate?: number;
  positive_rate?: number;
}

export interface CalibrationMetricsResponse {
  calibration_id: string;
  selected_method: string;
  method_rationale: string;
  dataset_metadata: Record<string, any>;
  methods_comparison: Record<string, CalibrationMethodItem>;
  score_thresholds: Record<string, ScoreThresholdTier>;
  explanation: string;
  created_at: string;
}

// ── Phase 16 Fairness and Bias Analysis Types ──
export interface SubgroupMetricItem {
  group_name: string;
  sample_count: number;
  sample_percentage: number;
  positive_count: number;
  positive_rate: number;
  precision: number;
  recall: number;
  f1_score: number;
  false_positive_rate: number;
  false_negative_rate: number;
  is_small_sample: boolean;
  sample_warning?: string | null;
}

export interface SubgroupAnalysisCategory {
  attribute: string;
  description: string;
  is_model_feature: boolean;
  groups: SubgroupMetricItem[];
  max_recall_disparity: number;
}

export interface FairnessReportResponse {
  audit_id: string;
  evaluated_at: string;
  model_name: string;
  model_version: string;
  dataset_metadata: Record<string, any>;
  feature_classification: Record<string, string[]>;
  prediction_feature_count: number;
  prediction_features: string[];
  subgroup_analyses: Record<string, SubgroupAnalysisCategory>;
  key_observations: string[];
  limitations_and_disclaimer: string;
}

// ── Phase 17 LLM Output Evaluation Types ──
export interface LLMEvalBenchmarkCase {
  case_id: string;
  scenario_name: string;
  customer_ref?: string | null;
  customer_name?: string | null;
  dimension_scores: Record<string, number>;
  overall_score: number;
  passed: boolean;
  safety_violations: string[];
  hallucinations: string[];
  evaluator_notes: string[];
  generated_insight_summary: string;
  generated_conv_opening: string;
}

export interface LLMEvalRegressionTracking {
  baseline_date: string;
  previous_run_score: number;
  target_threshold_score: number;
  status: string;
}

export interface LLMEvaluationReportResponse {
  evaluation_id: string;
  evaluated_at: string;
  prompt_version: string;
  dataset_version: string;
  llm_provider: string;
  total_scenarios: number;
  overall_average_rubric_score: number;
  max_possible_rubric_score: number;
  pass_rate_percentage: number;
  failure_count: number;
  safety_issue_count: number;
  hallucination_count: number;
  dimension_performance: Record<string, number>;
  scoring_rubric_guide: Record<string, any>;
  benchmark_cases: LLMEvalBenchmarkCase[];
  regression_baseline_tracking: LLMEvalRegressionTracking;
  disclaimer: string;
}

// ── Phase 19 MLOps Model Registry & Drift Types ──
export interface ModelProvenanceOut {
  random_seed: number;
  dataset_records: number;
  feature_count: number;
  hyperparameters: Record<string, any>;
  environment: Record<string, string>;
}

export interface ModelRegistryItemOut {
  version: string;
  model_name: string;
  status: "candidate" | "validated" | "active" | "archived";
  deployment_status: "deployed" | "staged" | "deprecated";
  is_active: boolean;
  created_at: string;
  training_dataset_version: string;
  feature_version: string;
  metrics: Record<string, number>;
  provenance: ModelProvenanceOut;
  description?: string | null;
}

export interface ModelRegistryResponse {
  registry_version: string;
  active_version: string;
  updated_at: string;
  models: ModelRegistryItemOut[];
}

export interface ModelPromotionResponse {
  success: boolean;
  message: string;
  active_version: string;
  timestamp: string;
}

export interface FeatureDriftItem {
  feature_name: string;
  thai_label: string;
  psi_score: number;
  status: "stable" | "moderate_drift" | "significant_drift";
  baseline_mean: number;
  current_mean: number;
  baseline_std: number;
  current_std: number;
  bin_breakdown: Array<{
    bin_index: number;
    expected_pct: number;
    actual_pct: number;
    psi_contribution: number;
  }>;
}

export interface PredictionDriftItem {
  metric_name: string;
  psi_score: number;
  status: string;
  baseline_high_priority_rate: number;
  current_high_priority_rate: number;
}

export interface ModelDriftReportResponse {
  report_id: string;
  evaluated_at: string;
  baseline_sample_count: number;
  current_sample_count: number;
  is_small_sample: boolean;
  sample_warning?: string | null;
  overall_data_drift_status: string;
  feature_drifts: FeatureDriftItem[];
  prediction_drift: PredictionDriftItem;
  drift_interpretation_guide: Record<string, string>;
  recommendations: string[];
}

// ── Phase 24 AI Evidence Dashboard Interfaces ──

export interface ErrorAnalysisResponse {
  total_test_samples: number;
  confusion_breakdown: Record<string, number>;
  overall_error_count: number;
  overall_error_rate: number;
  group_feature_profiles: Record<string, Record<string, number>>;
  score_band_error_concentration: Record<string, { total: number; false_positives: number; false_negatives: number; error_rate: number }>;
  representative_false_positives: Array<Record<string, any>>;
  representative_false_negatives: Array<Record<string, any>>;
}

export interface ThresholdGridItem {
  threshold: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  fpr: number;
  fnr: number;
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

export interface ThresholdAnalysisResponse {
  cv_grid_results: ThresholdGridItem[];
  selected_threshold: number;
  selection_rationale: string;
  holdout_test_result_at_selected_threshold: {
    selected_threshold: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    confusion_matrix: number[][];
  };
}

export interface FeatureSplitImportanceItem {
  feature: string;
  thai_label: string;
  split_importance: number;
  importance_pct: number;
}

export interface FeatureShapImportanceItem {
  feature: string;
  thai_label: string;
  mean_abs_shap: number;
}

export interface FeatureAnalysisResponse {
  feature_split_importance: FeatureSplitImportanceItem[];
  feature_shap_importance: FeatureShapImportanceItem[];
  ablation_experiments: Record<string, {
    feature_count: number;
    cv_f1_mean: number;
    cv_f1_std: number;
    cv_roc_auc_mean: number;
    features_used: string[];
  }>;
}

export interface LatencyBenchmarkResponse {
  benchmark_iterations: number;
  single_sample_prediction_latency_ms: number;
  single_sample_shap_latency_ms: number;
  total_combined_inference_latency_ms: number;
  shap_overhead_percentage: number;
}

export interface ModelEvidenceSummaryResponse {
  active_champion: string;
  model_version: string;
  dataset_version: string;
  dataset_type: string;
  evaluated_at: string;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
  };
  calibration: {
    brier_score: number;
    expected_calibration_error: number;
  };
  reliability: {
    total_test_samples: number;
    total_errors: number;
    error_rate: number;
    data_leakage_status: string;
    automated_test_count: number;
    automated_tests_passed: number;
    automated_tests_failed: number;
  };
  latency: {
    prediction_latency_ms: number;
    shap_latency_ms: number;
    total_inference_latency_ms: number;
    shap_overhead_pct: number;
  };
  governance: {
    active_version: string;
    total_registered_models: number;
    champion_status: string;
    candidate_status: string;
    rollback_ready: boolean;
  };
  candidate_comparison: Array<{
    model_name: string;
    version: string;
    status: string;
    f1_score: number;
    precision: number;
    recall: number;
    roc_auc: number;
    brier_score: number;
    ece: number;
    is_champion: boolean;
    reason_as_champion: string;
  }>;
  system_quality: {
    ai_guardrails_active: boolean;
    drift_monitoring_active: boolean;
    audit_logging_active: boolean;
    rbac_enforced: boolean;
  };
}

// ── Phase 25 LLM Cost, Latency & Optimization Types ──

export interface LLMPerformanceResponse {
  active_model: string;
  active_prompt_version: string;
  optimization_status: string;
  total_requests: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  avg_input_tokens: number;
  avg_output_tokens: number;
  avg_total_tokens: number;
  cache_hit_rate: number;
  fallback_rate: number;
  guardrail_rejection_rate: number;
  estimated_cost_per_1k_requests_usd: number;
  pricing_rates: {
    input_per_1k_usd: number;
    output_per_1k_usd: number;
  };
  cache_metrics: {
    cache_enabled: boolean;
    ttl_seconds: number;
    cache_entries_count: number;
    hits: number;
    misses: number;
    total_queries: number;
    hit_rate_pct: number;
    avg_cached_latency_ms: number;
    avg_uncached_latency_ms: number;
    latency_reduction_pct: number;
  };
  baseline_vs_optimized: {
    baseline: Record<string, any>;
    optimized: Record<string, any>;
  };
}

// ── Phase 26 Recommendation Optimization & Governance Types ──

export interface RecommendationPerformanceResponse {
  engine_version: string;
  status: string;
  total_recommendations: number;
  total_decisions: number;
  approval_rate_pct: number;
  modification_rate_pct: number;
  rejection_rate_pct: number;
  top_1_match_rate_pct: number;
  top_k_match_rate_pct: number;
  ineligible_recommendation_rate_pct: number;
  recommendation_coverage_pct: number;
  avg_recommendation_latency_ms: number;
  hard_eligibility_gate_active: boolean;
  as_of: string;
}

export interface RecommendationBenchmarkResponse {
  baseline_version: string;
  candidate_version: string;
  promoted_status: string;
  evaluation_timestamp: string;
  comparison: {
    top_1_match_rate: {
      baseline_v1: number;
      candidate_v1_1: number;
      improvement_diff_pct: number;
    };
    top_k_match_rate: {
      baseline_v1: number;
      candidate_v1_1: number;
      improvement_diff_pct: number;
    };
    ineligible_recommendation_rate: {
      baseline_v1: number;
      candidate_v1_1: number;
      reduction_pct: number;
    };
    latency_ms: {
      baseline_v1: number;
      candidate_v1_1: number;
      speedup_factor: number;
    };
    decision: string;
    decision_rationale: string;
  };
  candidate_metrics: Record<string, any>;
  failure_patterns_eliminated: string[];
}

export interface RecommendationErrorAnalysisResponse {
  total_evaluated_cases: number;
  total_broker_overrides: number;
  override_rate_pct: number;
  override_reasons_breakdown: Record<string, number>;
  override_rate_by_category: Record<string, number>;
  override_rate_by_segment: Record<string, number>;
  failure_patterns: Array<{
    pattern: string;
    frequency_in_v1_baseline: string;
    frequency_in_v1_1_candidate: string;
    status: string;
  }>;
  representative_cases: Array<{
    case_id: string;
    profile: string;
    v1_behavior: string;
    v1_1_behavior: string;
  }>;
}

export interface RecommendationConfigResponse {
  engine_version: string;
  hard_eligibility_gate: boolean;
  weights: {
    need_weight: number;
    base_weight: number;
    fit_weight: number;
  };
  coverage_gap_penalty: number;
  top_k_limit: number;
  active_catalog_products_count: number;
}

// ── Phase 27 End-to-End Performance & Benchmarking Types ──

export interface E2EWorkflowStep {
  step: number;
  name: string;
  avg_ms: number;
  p50_ms: number;
  p95_ms: number;
}

export interface E2EConcurrencyMetric {
  concurrency: number;
  throughput_req_per_sec: number;
  avg_latency_ms: number;
  p95_ms: number;
  error_rate_pct: number;
}

export interface E2EBottleneckItem {
  rank: number;
  component: string;
  latency_contribution_ms: number;
  percentage_share: number;
  optimization_strategy: string;
}

export interface E2EPerformanceBudget {
  endpoint_category: string;
  target_budget_ms: number;
  actual_avg_ms: number;
  status: string;
}

export interface E2EPerformanceResponse {
  benchmark_name: string;
  status: string;
  timestamp: string;
  environment: string;
  workflow_summary: {
    total_cold_latency_ms: number;
    total_warm_latency_ms: number;
    p50_ms: number;
    p95_ms: number;
    p99_ms: number;
    latency_reduction_warm_vs_cold_pct: number;
    throughput_req_per_sec: number;
    error_rate_pct: number;
  };
  component_breakdown: {
    database_ms: { avg: number; p50: number; p95: number; p99: number };
    ml_pipeline_ms: { avg: number; p50: number; p95: number; p99: number };
    shap_explainability_ms: { avg: number; p50: number; p95: number; p99: number };
    llm_cold_ms: { avg: number; p50: number; p95: number; p99: number };
    llm_warm_cached_ms: { avg: number; p50: number; p95: number; p99: number };
    recommendation_ms: { avg: number; p50: number; p95: number; p99: number };
    serialization_ms: { avg: number; p50: number; p95: number; p99: number };
  };
  steps_cold: E2EWorkflowStep[];
  steps_warm: E2EWorkflowStep[];
  concurrency_scaling: E2EConcurrencyMetric[];
  bottleneck_ranking: E2EBottleneckItem[];
  performance_budgets: E2EPerformanceBudget[];
}


// ── Phase 30: Pilot Evaluation Types ──
export interface PilotSession {
  id: string;
  user_id: string;
  scenario_id: string;
  customer_id?: string | null;
  started_at: string;
  completed_at?: string | null;
  status: "in_progress" | "completed" | "abandoned";
  time_taken_seconds?: number | null;
  features_used?: string[] | null;
  created_at: string;
}

export interface PilotFeedback {
  id: string;
  session_id?: string | null;
  user_id: string;
  scenario_id: string;
  rating_overall: number;
  rating_ease_of_use: number;
  rating_clarity_priority: number;
  rating_shap_explanation: number;
  rating_insight_usefulness: number;
  rating_recommendations: number;
  rating_trust: number;
  most_useful_feature?: string | null;
  least_useful_feature?: string | null;
  confusing_part?: string | null;
  comments?: string | null;
  created_at: string;
}

export interface PilotIssue {
  id: string;
  session_id?: string | null;
  user_id: string;
  severity: "P0" | "P1" | "P2";
  scenario_id?: string | null;
  component: string;
  description: string;
  steps_to_reproduce?: string | null;
  request_id?: string | null;
  status: "open" | "in_progress" | "resolved";
  created_at: string;
}

export interface TechnicalKPIs {
  api_error_rate: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  system_availability_pct: number;
  failed_requests_count: number;
}

export interface AIQualityKPIs {
  model_name: string;
  model_version: string;
  f1_score: number;
  roc_auc: number;
  brier_score: number;
  calibration_ece: number;
  recommendation_ineligible_rate: number;
  llm_fallback_rate: number;
  guardrail_violation_rate: number;
}

export interface HumanFeedbackAggregates {
  total_feedback_count: number;
  has_human_data: boolean;
  status_label: string;
  avg_overall_usefulness?: number | null;
  avg_ease_of_use?: number | null;
  avg_clarity_priority?: number | null;
  avg_shap_usefulness?: number | null;
  avg_insight_usefulness?: number | null;
  avg_recommendation_usefulness?: number | null;
  avg_trust_score?: number | null;
  top_useful_features: { feature: string; count: number }[];
  top_confusing_parts: string[];
}

export interface PilotScorecardRow {
  dimension: string;
  metric: string;
  target: string;
  actual: string;
  status: "PASS" | "PENDING" | "REVIEW";
}

export interface ParticipantBreakdown {
  total_participants: number;
  broker_participants: number;
  manager_participants: number;
  admin_participants: number;
}

export interface PilotDashboardResponse {
  environment: string;
  pilot_mode: boolean;
  total_sessions: number;
  completed_sessions: number;
  avg_session_duration_seconds?: number | null;
  median_session_duration_seconds?: number | null;
  participant_breakdown: ParticipantBreakdown;
  technical_kpis: TechnicalKPIs;
  ai_quality_kpis: AIQualityKPIs;
  human_feedback: HumanFeedbackAggregates;
  scorecard: PilotScorecardRow[];
  recent_issues: PilotIssue[];
  generated_at: string;
}

// ── Phase 32: Pilot Analysis & Evidence Validation Types ──
export interface DataQualityReport {
  total_sessions_checked: number;
  total_feedbacks_checked: number;
  total_issues_checked: number;
  valid_records_count: number;
  invalid_records_count: number;
  duplicate_records_count: number;
  anomalies: string[];
  quality_status: string;
}

export interface LikertQuestionAnalysis {
  question_key: string;
  question_title: string;
  sample_size: number;
  mean?: number | null;
  median?: number | null;
  std_dev?: number | null;
  distribution: { [key: number]: number };
  response_rate_pct: number;
  confidence_status: string;
}

export interface LikertAnalysisReport {
  has_human_data: boolean;
  total_responses: number;
  status_label: string;
  questions: LikertQuestionAnalysis[];
}

export interface ScenarioAnalysisRow {
  scenario_id: string;
  scenario_name: string;
  customer_ref: string;
  sessions_started: number;
  sessions_completed: number;
  completion_rate_pct: number;
  avg_duration_seconds?: number | null;
  median_duration_seconds?: number | null;
  feedback_count: number;
  issue_count: number;
  decisions: { [action: string]: number };
}

export interface DecisionAnalysisReport {
  total_decisions: number;
  approve_count: number;
  modify_count: number;
  reject_count: number;
  approve_rate_pct: number;
  modify_rate_pct: number;
  reject_rate_pct: number;
  override_rate_pct: number;
  top_modify_reasons: { reason: string; count: number }[];
  top_reject_reasons: { reason: string; count: number }[];
}

export interface EvidenceQualityRow {
  evidence_area: string;
  status: string;
  sample_size: string;
  confidence: string;
  source: string;
}

export interface PilotAnalysisSummaryResponse {
  analysis_version: string;
  generated_at: string;
  data_quality: DataQualityReport;
  human_sample_size: number;
  sessions_count: number;
  scenarios_coverage: number;
  likert_summary: LikertAnalysisReport;
  decision_summary: DecisionAnalysisReport;
  scenario_breakdown: ScenarioAnalysisRow[];
  technical_summary: { [key: string]: any };
  ai_evidence_summary: { [key: string]: any };
  evidence_scorecard: EvidenceQualityRow[];
  final_evidence_decision: string;
  decision_rationale: string;
}





