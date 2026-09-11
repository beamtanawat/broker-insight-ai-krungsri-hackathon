"use client";
import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { isAuthenticated, clearTokens } from "@/lib/auth";
import type {
  CustomerDetail,
  CustomerFullProfile,
  AnalyzeCustomerResponse,
  LLMInsightResponse,
  CustomerNeedAnalysisResponse,
  CustomerRecommendationsResponse,
  ConversationAssistantResponse,
  FollowUpSummary,
  User,
} from "@/types";
import { AppShell } from "@/components/layout";
import { Button, Tabs, Alert, Skeleton } from "@/components/ui";
import { CustomerHeader, DemoPersonaStrip } from "@/components/domain";
import {
  CustomerAlerts,
  DecisionSummary,
  CustomerOverview,
  CustomerPriority,
  CustomerRecommendations,
  CustomerPrep,
  CustomerTasks,
  ProposalOnePagerModal,
} from "@/components/customer";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [fullProfile, setFullProfile] = useState<CustomerFullProfile | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AnalyzeCustomerResponse | null>(null);
  const [insights, setInsights] = useState<LLMInsightResponse | null>(null);
  const [needAnalysis, setNeedAnalysis] = useState<CustomerNeedAnalysisResponse | null>(null);
  const [recommendations, setRecommendations] = useState<CustomerRecommendationsResponse | null>(null);
  const [conversationGuide, setConversationGuide] = useState<ConversationAssistantResponse | null>(null);
  const [followUps, setFollowUps] = useState<FollowUpSummary[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingConvo, setGeneratingConvo] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState<string | null>(null);
  const [creatingFu, setCreatingFu] = useState(false);
  const [refreshingRecs, setRefreshingRecs] = useState(false);
  const [recommendationNotice, setRecommendationNotice] = useState<{ message: string; variant: "success" | "warning" | "info" } | null>(null);

  const [activeTab, setActiveTab] = useState<string>("overview");
  const [showOnePager, setShowOnePager] = useState(false);

  const loadCustomerData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [me, detail, prof, fuList] = await Promise.all([
        api.auth.me(),
        api.customers.get(id),
        api.customers.getProfile(id).catch(() => null),
        api.customers.getFollowups(id).catch(() => ({ items: [], total: 0 })),
      ]);

      setUser(me as User);
      setCustomer(detail);
      setFullProfile(prof);
      setFollowUps(fuList.items || detail.follow_ups || []);

      if (detail.latest_score) {
        setAiAnalysis({
          customer_id: detail.id,
          external_ref: detail.external_ref,
          full_name: detail.full_name,
          score: detail.latest_score.score_display,
          probability: detail.latest_score.raw_probability ?? detail.latest_score.score,
          raw_probability: detail.latest_score.raw_probability ?? detail.latest_score.score,
          calibrated_probability: detail.latest_score.calibrated_probability ?? (detail.latest_score.score_display / 100),
          priority: (detail.latest_score.priority || detail.latest_score.priority_level) as any,
          priority_level: detail.latest_score.priority_level as any,
          factors: detail.latest_score.feature_importance || [],
          model_metadata: {
            model_name: "LightGBM Priority Scorer",
            model_version: detail.latest_score.model_version || "2.1.0",
            timestamp: detail.latest_score.scored_at || new Date().toISOString(),
            disclaimer: "Calibrated probability for broker prioritization.",
          },
          features_used: {},
        });
      }

      // Concurrently fetch AI models insights and recommendations
      api.customers.getInsights(id).then(setInsights).catch(() => null);
      api.customers.getNeeds(id).then(setNeedAnalysis).catch(() => null);
      api.customers.getRecommendations(id).then(setRecommendations).catch(() => null);
    } catch (err: any) {
      if (err?.message?.includes("Session expired") || !isAuthenticated()) {
        clearTokens();
        router.push("/login");
      } else {
        setError(err?.message || "ไม่สามารถโหลดข้อมูลลูกค้าได้ กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadCustomerData();
  }, [loadCustomerData, router]);

  // Handler: Re-run AI Analysis
  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await api.customers.analyze(id);
      setAiAnalysis(res);
      const [newInsights, newNeeds, newRecs] = await Promise.all([
        api.customers.getInsights(id).catch(() => null),
        api.customers.getNeeds(id).catch(() => null),
        api.customers.getRecommendations(id).catch(() => null),
      ]);
      if (newInsights) setInsights(newInsights);
      if (newNeeds) setNeedAnalysis(newNeeds);
      if (newRecs) setRecommendations(newRecs);
      setActiveTab("priority");
    } catch (err: any) {
      setError(err?.message || "การวิเคราะห์ AI ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setAnalyzing(false);
    }
  };

  // Handler: Generate Conversation Guide
  const handleGenerateConversation = async () => {
    setGeneratingConvo(true);
    try {
      const guide = await api.customers.generateConversation(id);
      setConversationGuide(guide);
      setActiveTab("prep");
    } catch (err: any) {
      setError(err?.message || "ไม่สามารถสร้างแนวทางสนทนาได้");
    } finally {
      setGeneratingConvo(false);
    }
  };

  // Handler: Refresh Recommendations
  const handleRefreshRecommendations = async () => {
    setRefreshingRecs(true);
    try {
      const updatedRecs = await api.customers.getRecommendations(id);
      setRecommendations(updatedRecs);
      setRecommendationNotice({
        message: "คำนวณและอัปเดตผลการจับคู่ผลิตภัณฑ์แนะนำ (AI Product Matching) ล่าสุดเรียบร้อยแล้ว",
        variant: "success",
      });
      setTimeout(() => setRecommendationNotice(null), 5000);
    } catch (err: any) {
      setError(err?.message || "ไม่สามารถคำนวณคำแนะนำใหม่ได้");
    } finally {
      setRefreshingRecs(false);
    }
  };

  // Handler: Record Broker Decision
  const handleRecordDecision = async (
    recId: string,
    action: "approve" | "modify" | "reject" | "reset",
    reason?: string,
    feedback?: string
  ) => {
    setDecisionLoading(recId);
    try {
      await api.customers.recordDecision(id, recId, {
        action,
        reason,
        feedback,
      });
      // Refresh recommendations to update decision status
      const updatedRecs = await api.customers.getRecommendations(id);
      setRecommendations(updatedRecs);

      const actionLabels: Record<string, string> = {
        approve: "เห็นชอบ (Approve)",
        modify: "ปรับเปลี่ยนข้อเสนอ (Modify)",
        reject: "ปฏิเสธข้อเสนอ (Reject)",
        reset: "รีเซ็ตสถานะ (Reset)",
      };
      setRecommendationNotice({
        message: `บันทึกการตัดสินใจ '${actionLabels[action] || action}' สำเร็จ ข้อมูลถูกบันทึกลงระบบและ MLOps Feedback Loop แล้ว`,
        variant: action === "approve" ? "success" : action === "modify" ? "warning" : "info",
      });
      setTimeout(() => setRecommendationNotice(null), 5000);
    } catch (err: any) {
      setError(err?.message || "บันทึกการตัดสินใจไม่สำเร็จ");
    } finally {
      setDecisionLoading(null);
    }
  };

  // Handler: Create Follow-up
  const handleCreateFollowup = async (
    scheduledDate: string,
    notes: string,
    priority: "high" | "medium" | "low"
  ) => {
    setCreatingFu(true);
    try {
      await api.customers.createFollowup(id, {
        scheduled_date: scheduledDate || null,
        notes,
        priority,
        status: "open",
      });
      const updatedFu = await api.customers.getFollowups(id);
      setFollowUps(updatedFu.items);
    } catch (err: any) {
      setError(err?.message || "สร้างนัดหมายไม่สำเร็จ");
    } finally {
      setCreatingFu(false);
    }
  };

  // Handler: Update Follow-up Status
  const handleUpdateFollowup = async (
    followupId: string,
    updateData: { status?: string; notes?: string }
  ) => {
    try {
      await api.customers.updateFollowup(id, followupId, updateData as any);
      const updatedFu = await api.customers.getFollowups(id);
      setFollowUps(updatedFu.items);
    } catch (err: any) {
      setError(err?.message || "ปรับปรุงสถานะงานติดตามไม่สำเร็จ");
    }
  };

  if (loading && !customer) {
    return (
      <AppShell user={user}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <Skeleton height="80px" borderRadius="var(--radius-lg)" />
          <Skeleton height="40px" borderRadius="var(--radius-md)" />
          <Skeleton height="320px" borderRadius="var(--radius-lg)" />
        </div>
      </AppShell>
    );
  }

  if (!customer) {
    return (
      <AppShell user={user}>
        <Alert variant="danger" action={<Link href="/customers"><Button size="sm">กลับหน้ารายชื่อ</Button></Link>}>
          ไม่พบข้อมูลลูกค้ารหัส "{id}" ในระบบ
        </Alert>
      </AppShell>
    );
  }

  const priorityLevel = aiAnalysis?.priority_level || customer.latest_score?.priority_level || "medium";
  const priorityLabel = priorityLevel === "high" ? "ความสำคัญสูง (High)" : priorityLevel === "medium" ? "ปานกลาง (Medium)" : "ต่ำ (Low)";
  const profile = customer.profile || fullProfile?.profile;

  const tabsConfig = [
    { id: "overview", label: "ภาพรวมลูกค้า (Overview)", icon: "👤" },
    { id: "priority", label: "ความสำคัญ & AI (Priority)", icon: "⚡" },
    { id: "recommend", label: "คำแนะนำผลิตภัณฑ์ (Recommend)", icon: "🛡️" },
    { id: "prep", label: "เตรียมบทสนทนา (Prep)", icon: "💬" },
    { id: "tasks", label: "งานติดตาม (Tasks)", icon: "📋", badge: followUps.filter((f) => f.status === "open").length > 0 ? String(followUps.filter((f) => f.status === "open").length) : undefined },
  ];

  return (
    <AppShell user={user}>
      {/* ── Demo Persona Switcher Strip (Hackathon Mode) ── */}
      <DemoPersonaStrip />

      {/* ── 1. Persistent Customer Header Strip ── */}
      <div style={{ marginBottom: "var(--space-4)" }}>
        <CustomerHeader
          fullName={customer.full_name}
          externalRef={`รหัส: ${customer.external_ref}`}
          segment={profile?.relationship_tier || "Standard Tier"}
          priorityLabel={priorityLabel}
          priorityVariant={priorityLevel as any}
          kycStatus={profile?.kyc_status as any}
          lastContact={customer.follow_ups?.[0]?.last_contact_date || "ยังไม่มีข้อมูล"}
          nextFollowUp={customer.follow_ups?.[0]?.scheduled_date || "ยังไม่มีนัดหมาย"}
          primaryAction={
            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
              <Link href="/customers">
                <Button variant="outline" size="sm" leftIcon="←">
                  รายชื่อลูกค้า
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                leftIcon="📄"
                onClick={() => setShowOnePager(true)}
              >
                สรุปข้อเสนอ (One-Pager)
              </Button>
              <Button
                variant="gold"
                size="sm"
                leftIcon="⚡"
                onClick={handleAnalyze}
                isLoading={analyzing}
              >
                วิเคราะห์ AI
              </Button>
            </div>
          }
        />
      </div>

      {/* ── 2. Real-Data Alert Strip ── */}
      <CustomerAlerts customer={customer} followUps={followUps} />

      {/* ── 3. Decision Summary Quick Brief ── */}
      <DecisionSummary
        customer={customer}
        aiAnalysis={aiAnalysis}
        recommendations={recommendations}
        onNavigateTab={(t) => setActiveTab(t)}
      />

      {error && (
        <Alert variant="danger" style={{ marginBottom: "var(--space-5)" }} action={<Button size="sm" onClick={loadCustomerData}>ลองใหม่</Button>}>
          {error}
        </Alert>
      )}

      {/* ── 4. Exact 5-Tab Navigation ── */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        <Tabs
          tabs={tabsConfig}
          activeTab={activeTab}
          onChange={(t) => setActiveTab(t)}
        />
      </div>

      {/* ── 5. Tab Content Workflow Views ── */}
      {activeTab === "overview" && (
        <CustomerOverview
          customer={customer}
          fullProfile={fullProfile}
        />
      )}

      {activeTab === "priority" && (
        <CustomerPriority
          customer={customer}
          aiAnalysis={aiAnalysis}
          insights={insights}
          needAnalysis={needAnalysis}
          loading={analyzing}
          onRefreshAnalysis={handleAnalyze}
        />
      )}

      {activeTab === "recommend" && (
        <CustomerRecommendations
          customer={customer}
          recommendations={recommendations}
          loading={refreshingRecs}
          onRefreshRecommendations={handleRefreshRecommendations}
          onRecordDecision={handleRecordDecision}
          decisionLoading={decisionLoading}
          notification={recommendationNotice}
          onClearNotification={() => setRecommendationNotice(null)}
          onNavigateTab={(t) => setActiveTab(t)}
        />
      )}

      {activeTab === "prep" && (
        <CustomerPrep
          customer={customer}
          conversationGuide={conversationGuide}
          loading={generatingConvo}
          onGenerateConversation={handleGenerateConversation}
        />
      )}

      {activeTab === "tasks" && (
        <CustomerTasks
          customer={customer}
          followUps={followUps}
          loading={loading}
          onCreateFollowup={handleCreateFollowup}
          onUpdateFollowup={handleUpdateFollowup}
          creating={creatingFu}
        />
      )}

      {/* ── Proposal One-Pager Modal ── */}
      {showOnePager && customer && (
        <ProposalOnePagerModal
          isOpen={showOnePager}
          onClose={() => setShowOnePager(false)}
          customer={customer}
          fullProfile={fullProfile}
          aiAnalysis={aiAnalysis}
          recommendations={recommendations}
          user={user}
        />
      )}
    </AppShell>
  );
}
