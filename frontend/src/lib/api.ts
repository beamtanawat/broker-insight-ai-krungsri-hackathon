// Typed API client with automatic JWT injection and refresh
import { getAccessToken, refreshAccessToken, clearTokens } from "./auth";
import type {
  CustomerListItem,
  CustomerDetail,
  CustomerFullProfile,
  DashboardSummary,
  AnalyzeCustomerResponse,
  LLMInsightResponse,
  CustomerNeedAnalysisResponse,
  CustomerRecommendationsResponse,
  BrokerDecisionOut,
  ConversationAssistantResponse,
  FollowUpCreate,
  CustomerAuditHistoryResponse,
  FollowUpSummary,
  FollowUp,
  AuditLog,
  User,
  ModelMetricsResponse,
  ModelVersionsResponse,
  ModelMonitoringStatsResponse,
  ModelFeedbackCreate,
  ModelFeedbackOut,
  RecommendationAnalyticsResponse,
  AnalyticsOverviewResponse,
  PriorityAnalyticsResponse,
  NeedAnalyticsResponse,
  FollowUpAnalyticsResponse,
  AIUsageAnalyticsResponse,
  ModelComparisonResponse,
  CalibrationMetricsResponse,
  FairnessReportResponse,
  LLMEvaluationReportResponse,
  ModelRegistryResponse,
  ModelPromotionResponse,
  ModelDriftReportResponse,
  ModelEvidenceSummaryResponse,
  ErrorAnalysisResponse,
  ThresholdAnalysisResponse,
  FeatureAnalysisResponse,
  LatencyBenchmarkResponse,
  LLMPerformanceResponse,
  RecommendationPerformanceResponse,
  RecommendationBenchmarkResponse,
  RecommendationErrorAnalysisResponse,
  RecommendationConfigResponse,
  E2EPerformanceResponse,
} from "../types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let token = getAccessToken();

  const makeRequest = async (t: string | null) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...(options.headers as Record<string, string>),
    };
    return fetch(`${API_BASE}${path}`, { ...options, headers });
  };

  let res = await makeRequest(token);

  if (res.status === 401 && token) {
    token = await refreshAccessToken();
    if (token) {
      res = await makeRequest(token);
    } else {
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please log in again.");
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── API Methods ──────────────────────────────────────────────────
export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ access_token: string; refresh_token: string; token_type: string }>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<User>("/api/v1/auth/me"),
  },

  // ── Dashboard ────────────────────────────────────────────────────
  dashboard: {
    summary: () => request<DashboardSummary>("/api/v1/dashboard/summary"),
    team: () => request<any>("/api/v1/dashboard/team"),
  },

  // ── Customers ────────────────────────────────────────────────────
  customers: {
    list: (
      page = 1,
      pageSize = 50,
      priority?: string,
      search?: string,
      kycStatus?: string
    ) => {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (priority && priority !== "all") params.append("priority", priority);
      if (search) params.append("search", search);
      if (kycStatus) params.append("kyc_status", kycStatus);
      return request<{ items: CustomerListItem[]; total: number; page: number; page_size: number }>(
        `/api/v1/customers?${params.toString()}`
      );
    },
    get: (id: string) => request<CustomerDetail>(`/api/v1/customers/${id}`),
    getProfile: (id: string) => request<CustomerFullProfile>(`/api/v1/customers/${id}/profile`),
    getFollowups: (id: string) => request<{ items: FollowUpSummary[]; total: number }>(`/api/v1/customers/${id}/follow-ups`),
    createFollowup: (id: string, data: FollowUpCreate) =>
      request<FollowUpSummary>(`/api/v1/customers/${id}/follow-ups`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateFollowup: (id: string, followupId: string, data: Partial<FollowUpCreate>) =>
      request<FollowUpSummary>(`/api/v1/customers/${id}/follow-ups/${followupId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    analyze: (id: string) => request<AnalyzeCustomerResponse>(`/api/v1/customers/${id}/analyze`, {
      method: "POST",
    }),
    getInsights: (id: string) => request<LLMInsightResponse>(`/api/v1/customers/${id}/insights`),
    getNeeds: (id: string) => request<CustomerNeedAnalysisResponse>(`/api/v1/customers/${id}/needs`),
    getRecommendations: (id: string) => request<CustomerRecommendationsResponse>(`/api/v1/customers/${id}/recommendations`),
    recordDecision: (customerId: string, recommendationId: string, data: { action: string; reason?: string; feedback?: string; notes?: string }) =>
      request<BrokerDecisionOut>(`/api/v1/customers/${customerId}/recommendations/${recommendationId}/decision`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    generateConversation: (id: string) =>
      request<ConversationAssistantResponse>(`/api/v1/customers/${id}/conversation`, {
        method: "POST",
      }),
    getAuditLogs: (id: string) =>
      request<CustomerAuditHistoryResponse>(`/api/v1/customers/${id}/audit-logs`),
  },

  // ── Recommendations (Phases 11, 26) ──────────────────────────────────
  recommendations: {
    recordDecision: (recommendationId: string, data: { action: string; reason?: string; feedback?: string; notes?: string }) =>
      request<BrokerDecisionOut>(`/api/v1/recommendations/${recommendationId}/decision`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    analytics: () => request<RecommendationAnalyticsResponse>("/api/v1/recommendations/analytics"),
    getPerformance: () => request<RecommendationPerformanceResponse>("/api/v1/recommendations/performance"),
    getBenchmark: () => request<RecommendationBenchmarkResponse>("/api/v1/recommendations/benchmark"),
    getErrors: () => request<RecommendationErrorAnalysisResponse>("/api/v1/recommendations/errors"),
    getConfig: () => request<RecommendationConfigResponse>("/api/v1/recommendations/config"),
  },

  // ── Scoring Legacy / Refresh ─────────────────────────────────────
  scores: {
    get: (customerId: string) => request<any>(`/api/v1/score/${customerId}`),
    refresh: (customerId: string) => request<AnalyzeCustomerResponse>(`/api/v1/customers/${customerId}/analyze`, {
      method: "POST",
    }),
  },

  // ── Follow-up Global ─────────────────────────────────────────────
  followups: {
    list: () => request<FollowUp[]>("/api/v1/followup"),
    get: (id: string) => request<FollowUp>(`/api/v1/followup/${id}`),
    update: (id: string, data: { notes?: string; status?: string; payment_status?: string }) =>
      request<FollowUp>(`/api/v1/followup/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  // ── Audit ────────────────────────────────────────────────────────
  audit: {
    list: (page = 1) =>
      request<{ items: AuditLog[]; total: number; page: number }>(`/api/v1/audit?page=${page}`),
  },

  // ── Model Monitoring, Calibration, Fairness, LLM Evaluation, MLOps Registry, Drift, Evidence, LLM Opt & E2E Performance (Phases 10-27) ──
  model: {
    getE2EPerformance: () => request<E2EPerformanceResponse>("/api/v1/model/e2e-performance"),
    getLLMPerformance: () => request<LLMPerformanceResponse>("/api/v1/model/llm-performance"),
    getEvidence: () => request<ModelEvidenceSummaryResponse>("/api/v1/model/evidence"),
    getErrors: () => request<ErrorAnalysisResponse>("/api/v1/model/errors"),
    getThresholdAnalysis: () => request<ThresholdAnalysisResponse>("/api/v1/model/threshold-analysis"),
    getFeatures: () => request<FeatureAnalysisResponse>("/api/v1/model/features"),
    getLatency: () => request<LatencyBenchmarkResponse>("/api/v1/model/latency"),
    getMetrics: () => request<ModelMetricsResponse>("/api/v1/model/metrics"),
    getBenchmark: () => request<ModelComparisonResponse>("/api/v1/model/benchmark"),
    getCalibration: () => request<CalibrationMetricsResponse>("/api/v1/model/calibration"),
    getFairness: () => request<FairnessReportResponse>("/api/v1/model/fairness"),
    getLLMEvaluation: () => request<LLMEvaluationReportResponse>("/api/v1/model/llm-evaluation"),
    getRegistry: () => request<ModelRegistryResponse>("/api/v1/model/registry"),
    promote: (version: string) =>
      request<ModelPromotionResponse>("/api/v1/model/promote", {
        method: "POST",
        body: JSON.stringify({ version }),
      }),
    rollback: (target_version: string) =>
      request<ModelPromotionResponse>("/api/v1/model/rollback", {
        method: "POST",
        body: JSON.stringify({ target_version }),
      }),
    getDrift: () => request<ModelDriftReportResponse>("/api/v1/model/drift"),
    getVersions: () => request<ModelVersionsResponse>("/api/v1/model/versions"),
    getMonitoring: () => request<ModelMonitoringStatsResponse>("/api/v1/model/monitoring"),
    submitFeedback: (data: ModelFeedbackCreate) =>
      request<ModelFeedbackOut>("/api/v1/model/feedback", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    listFeedback: (customerId?: string, page = 1) => {
      const qs = customerId ? `&customer_id=${customerId}` : "";
      return request<{ items: ModelFeedbackOut[]; total: number }>(`/api/v1/model/feedback?page=${page}${qs}`);
    },
  },

  // ── Advanced Analytics (Phase 12) ─────────────────────────────────
  analytics: {
    overview: () => request<AnalyticsOverviewResponse>("/api/v1/analytics/overview"),
    priority: () => request<PriorityAnalyticsResponse>("/api/v1/analytics/priority"),
    needs: () => request<NeedAnalyticsResponse>("/api/v1/analytics/needs"),
    recommendations: () => request<RecommendationAnalyticsResponse>("/api/v1/analytics/recommendations"),
    followUps: () => request<FollowUpAnalyticsResponse>("/api/v1/analytics/follow-ups"),
    aiUsage: () => request<AIUsageAnalyticsResponse>("/api/v1/analytics/ai-usage"),
  },

  // ── Pilot Evaluation & Feedback (Phase 30) ────────────────────────
  pilot: {
    startSession: (data: { scenario_id: string; customer_id?: string }) =>
      request<any>("/api/v1/pilot/sessions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    completeSession: (id: string, data: { time_taken_seconds: number; status?: string; features_used?: string[] }) =>
      request<any>(`/api/v1/pilot/sessions/${id}/complete`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    submitFeedback: (sessionId: string, data: any) =>
      request<any>(`/api/v1/pilot/sessions/${sessionId}/feedback`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    submitStandaloneFeedback: (data: any) =>
      request<any>("/api/v1/pilot/feedback", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    reportIssue: (data: { severity: string; scenario_id?: string; component: string; description: string; steps_to_reproduce?: string; request_id?: string }) =>
      request<any>("/api/v1/pilot/issues", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getDashboard: () => request<any>("/api/v1/pilot/dashboard"),
    getSessions: () => request<any[]>("/api/v1/pilot/sessions"),
    getIssues: () => request<any[]>("/api/v1/pilot/issues"),
    freezeSnapshot: (label = "Pilot Sandbox Snapshot v1.0") =>
      request<any>(`/api/v1/pilot/freeze?label=${encodeURIComponent(label)}`, {
        method: "POST",
      }),
    getSnapshots: () => request<{ snapshots: string[] }>("/api/v1/pilot/snapshots"),
    getAnalysis: () => request<any>("/api/v1/pilot/analysis"),
    getLikertAnalysis: () => request<any>("/api/v1/pilot/analysis/likert"),
    getScenarioAnalysis: () => request<any[]>("/api/v1/pilot/analysis/scenarios"),
    getDecisionAnalysis: () => request<any>("/api/v1/pilot/analysis/decisions"),
    exportAnalysisUrl: (format = "json") => `/api/v1/pilot/analysis/export?format=${format}`,
  },
};

// ── Chat (SSE streaming) ──────────────────────────────────────────
export async function streamChat(
  content: string,
  customerId: string | null,
  sessionId: string | null,
  onChunk: (chunk: string) => void,
  onDone: (sessionId: string) => void
) {
  const token = getAccessToken();
  const res = await fetch("/api/v1/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ content, customer_id: customerId, session_id: sessionId }),
  });

  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split("\n");
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = JSON.parse(line.slice(6));
      if (data.chunk) onChunk(data.chunk);
      if (data.done) onDone(data.session_id);
    }
  }
}
