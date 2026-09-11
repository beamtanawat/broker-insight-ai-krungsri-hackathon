"use client";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { isAuthenticated, clearTokens } from "@/lib/auth";
import type {
  AnalyticsOverviewResponse,
  PriorityAnalyticsResponse,
  NeedAnalyticsResponse,
  RecommendationAnalyticsResponse,
  FollowUpAnalyticsResponse,
  AIUsageAnalyticsResponse,
  User,
} from "@/types";
import { AppShell } from "@/components/layout";
import { Card, Badge, Button, Alert, Skeleton, useToast } from "@/components/ui";
import { PageHeader } from "@/components/domain";

export default function AnalyticsDashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [overview, setOverview] = useState<AnalyticsOverviewResponse | null>(null);
  const [priority, setPriority] = useState<PriorityAnalyticsResponse | null>(null);
  const [needs, setNeeds] = useState<NeedAnalyticsResponse | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationAnalyticsResponse | null>(null);
  const [followups, setFollowups] = useState<FollowUpAnalyticsResponse | null>(null);
  const [aiUsage, setAiUsage] = useState<AIUsageAnalyticsResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [me, o, p, n, r, f, a] = await Promise.all([
        api.auth.me().catch(() => null),
        api.analytics.overview(),
        api.analytics.priority(),
        api.analytics.needs(),
        api.analytics.recommendations(),
        api.analytics.followUps(),
        api.analytics.aiUsage(),
      ]);
      setUser(me);
      setOverview(o);
      setPriority(p);
      setNeeds(n);
      setRecommendations(r);
      setFollowups(f);
      setAiUsage(a);
    } catch (err: any) {
      if (err?.message?.includes("Session expired") || !isAuthenticated()) {
        clearTokens();
        router.push("/login");
      } else {
        setError(err?.message || "ไม่สามารถโหลดข้อมูลสถิติการวิเคราะห์ได้");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadData();
  }, [loadData, router]);

  // Compute key summary figures
  const highPriorityCount = overview?.high_priority_customers ?? priority?.priority_distribution?.high ?? 0;
  const medPriorityCount = overview?.medium_priority_customers ?? priority?.priority_distribution?.medium ?? 0;
  const lowPriorityCount = overview?.low_priority_customers ?? priority?.priority_distribution?.low ?? 0;
  const totalCustomers = (overview?.total_customers ?? (highPriorityCount + medPriorityCount + lowPriorityCount)) || 1;

  const totalFollowups = followups?.total_follow_ups ?? 0;
  const completedFollowups = followups?.completed_count ?? overview?.follow_ups_completed ?? 0;
  const overdueFollowups = followups?.overdue_count ?? overview?.follow_ups_overdue ?? 0;
  const completionRate = totalFollowups > 0 ? Math.round((completedFollowups / totalFollowups) * 100) : 0;

  const totalDecisions = recommendations?.total_decisions ?? 0;
  const approvalRate = recommendations?.approval_rate ? Math.round(recommendations.approval_rate * 100) : 0;
  const modificationRate = recommendations?.modification_rate ? Math.round(recommendations.modification_rate * 100) : 0;
  const rejectionRate = recommendations?.rejection_rate ? Math.round(recommendations.rejection_rate * 100) : 0;

  const totalAIRequests =
    (aiUsage?.total_ai_scoring_requests ?? 0) +
    (aiUsage?.total_llm_insight_requests ?? 0) +
    (aiUsage?.total_conversation_requests ?? 0);

  const exportCSV = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const rows = [
      ["หมวดหมู่ (Category)", "ตัวชี้วัด (Metric)", "ค่าสถิติ (Value)"],
      ["ลูกค้า (Customers)", "ความสำคัญสูง (High Priority)", highPriorityCount],
      ["ลูกค้า (Customers)", "ความสำคัญปานกลาง (Medium Priority)", medPriorityCount],
      ["ลูกค้า (Customers)", "ความสำคัญต่ำ (Low Priority)", lowPriorityCount],
      ["ลูกค้า (Customers)", "รวมพอร์ตลูกค้าทั้งหมด (Total Customers)", totalCustomers],
      ["การตัดสินใจผลิตภัณฑ์ (Product Decisions)", "อัตราเห็นชอบ (Approval Rate %)", `${approvalRate}%`],
      ["การตัดสินใจผลิตภัณฑ์ (Product Decisions)", "จำนวนรายการเห็นชอบ (Approved Count)", recommendations?.approval_count ?? 0],
      ["การตัดสินใจผลิตภัณฑ์ (Product Decisions)", "อัตราปรับเปลี่ยน (Modification Rate %)", `${modificationRate}%`],
      ["การตัดสินใจผลิตภัณฑ์ (Product Decisions)", "จำนวนรายการปรับเปลี่ยน (Modified Count)", recommendations?.modification_count ?? 0],
      ["การตัดสินใจผลิตภัณฑ์ (Product Decisions)", "อัตราปฏิเสธ (Rejection Rate %)", `${rejectionRate}%`],
      ["การตัดสินใจผลิตภัณฑ์ (Product Decisions)", "จำนวนรายการปฏิเสธ (Rejected Count)", recommendations?.rejection_count ?? 0],
      ["งานติดตามผล (Follow-ups)", "งานรอติดตาม (Due Tasks)", followups?.due_count ?? overview?.follow_ups_due ?? 0],
      ["งานติดตามผล (Follow-ups)", "เกินกำหนด (Overdue Tasks)", overdueFollowups],
      ["งานติดตามผล (Follow-ups)", "เสร็จสิ้นแล้ว (Completed Tasks)", completedFollowups],
      ["งานติดตามผล (Follow-ups)", "อัตราการส่งมอบเสร็จสิ้น (Completion Rate %)", `${completionRate}%`],
      ["การเรียกใช้งาน AI (AI Workflows)", "AI Priority Scoring (LightGBM)", aiUsage?.total_ai_scoring_requests ?? 0],
      ["การเรียกใช้งาน AI (AI Workflows)", "LLM Customer Insight (Gemini/Claude)", aiUsage?.total_llm_insight_requests ?? 0],
      ["การเรียกใช้งาน AI (AI Workflows)", "AI Copilot Prep Requests", aiUsage?.total_conversation_requests ?? 0],
      ["การเรียกใช้งาน AI (AI Workflows)", "รวมการเรียกใช้ทั้งหมด (Total AI Requests)", totalAIRequests],
    ];

    const csvContent = "\uFEFF" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `krungsri_broker_analytics_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("ดาวน์โหลดรายงานสรุปผล CSV สำเร็จแล้ว", "ส่งออกรายงาน");
  };

  return (
    <AppShell user={user}>
      {/* ── 1. Page Header ── */}
      <PageHeader
        title="ภาพรวมธุรกิจและผลการดำเนินงาน (Business View)"
        description="ติดตามกิจกรรมลูกค้า การติดตามผลของนายหน้า และอัตราการตอบรับคำแนะนำผลิตภัณฑ์"
        breadcrumbs={[
          { label: "ปฏิบัติการ (Operations)" },
          { label: "ภาพรวมธุรกิจ (Business View)" },
        ]}
        primaryAction={
          <Button variant="gold" size="sm" leftIcon="🔄" onClick={loadData} isLoading={loading}>
            รีเฟรชข้อมูล
          </Button>
        }
        secondaryAction={
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Button variant="outline" size="sm" leftIcon="📥" onClick={exportCSV}>
              ส่งออกรายงาน CSV
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" leftIcon="🏠">
                แดชบอร์ดนายหน้า
              </Button>
            </Link>
          </div>
        }
      />

      {error && (
        <Alert variant="danger" style={{ marginBottom: "var(--space-5)" }} action={<Button size="sm" onClick={loadData}>ลองใหม่</Button>}>
          {error}
        </Alert>
      )}

      {/* ── 2. Actionable KPI Row ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--space-4)",
          marginBottom: "var(--space-6)",
        }}
      >
        {/* KPI 1: High Priority Proportion */}
        <Card className="hover-lift" noPadding style={{ borderTop: "3px solid #ef4444" }}>
          <div style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", color: "var(--slate-500)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>ลูกค้าความสำคัญสูง</span>
              <span style={{ fontSize: "16px" }}>🔥</span>
            </div>
            <div style={{ fontSize: "var(--fs-3xl)", fontWeight: 800, color: "#dc2626", marginTop: "4px" }}>
              {loading ? <Skeleton width="48px" height="36px" /> : highPriorityCount}
            </div>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "2px" }}>
              คิดเป็น {Math.round((highPriorityCount / totalCustomers) * 100)}% ของพอร์ตทั้งหมด ({totalCustomers} ราย)
            </div>
          </div>
        </Card>

        {/* KPI 2: Follow-up Completion Rate */}
        <Card className="hover-lift" noPadding style={{ borderTop: "3px solid var(--krungsri-yellow)" }}>
          <div style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", color: "var(--slate-500)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>อัตราส่งมอบงานติดตาม</span>
              <span style={{ fontSize: "16px" }}>📋</span>
            </div>
            <div style={{ fontSize: "var(--fs-3xl)", fontWeight: 800, color: "var(--krungsri-navy)", marginTop: "4px" }}>
              {loading ? <Skeleton width="48px" height="36px" /> : `${completionRate}%`}
            </div>
            <div style={{ fontSize: "var(--fs-xs)", color: overdueFollowups > 0 ? "var(--danger-solid)" : "var(--slate-500)", marginTop: "2px", fontWeight: overdueFollowups > 0 ? 700 : 400 }}>
              {overdueFollowups > 0 ? `⚠️ ค้างส่งมอบเกินกำหนด ${overdueFollowups} งาน` : `เสร็จสิ้น ${completedFollowups} จาก ${totalFollowups} งาน`}
            </div>
          </div>
        </Card>

        {/* KPI 3: Recommendation Acceptance Rate */}
        <Card className="hover-lift" noPadding style={{ borderTop: "3px solid #10b981" }}>
          <div style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", color: "var(--slate-500)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>อัตราเห็นชอบคำแนะนำ</span>
              <span style={{ fontSize: "16px" }}>🛡️</span>
            </div>
            <div style={{ fontSize: "var(--fs-3xl)", fontWeight: 800, color: "#059669", marginTop: "4px" }}>
              {loading ? <Skeleton width="48px" height="36px" /> : `${approvalRate}%`}
            </div>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "2px" }}>
              จากการตัดสินใจของนายหน้ารวม {totalDecisions} ครั้ง
            </div>
          </div>
        </Card>

        {/* KPI 4: Total AI Workflows */}
        <Card className="hover-lift" noPadding style={{ borderTop: "3px solid #3b82f6" }}>
          <div style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", color: "var(--slate-500)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>การใช้งาน AI สนับสนุน</span>
              <span style={{ fontSize: "16px" }}>⚡</span>
            </div>
            <div style={{ fontSize: "var(--fs-3xl)", fontWeight: 800, color: "var(--krungsri-navy)", marginTop: "4px" }}>
              {loading ? <Skeleton width="48px" height="36px" /> : totalAIRequests.toLocaleString()}
            </div>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "2px" }}>
              Scoring + LLM Insights + Copilot Prep
            </div>
          </div>
        </Card>
      </div>

      {/* ── 3. Analytical Sections Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "var(--space-6)" }}>
        
        {/* ── Section A: Customer Priority Distribution ── */}
        <Card
          title="👥 การกระจายความสำคัญของลูกค้า (Priority Breakdown)"
          subtitle="สัดส่วนลูกค้าที่ระบบ AI จัดลำดับตามระดับความเร่งด่วนในการติดต่อ"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {/* Priority Progress Bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-xs)", fontWeight: 700, marginBottom: "4px" }}>
                  <span style={{ color: "var(--priority-high-text)" }}>🔥 ความสำคัญสูง (High)</span>
                  <span>{highPriorityCount} ราย ({Math.round((highPriorityCount / totalCustomers) * 100)}%)</span>
                </div>
                <div style={{ height: "8px", backgroundColor: "var(--slate-100)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${(highPriorityCount / totalCustomers) * 100}%`, height: "100%", backgroundColor: "var(--priority-high-solid)", borderRadius: "4px" }} />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-xs)", fontWeight: 700, marginBottom: "4px" }}>
                  <span style={{ color: "var(--priority-med-text)" }}>⚡ ความสำคัญปานกลาง (Medium)</span>
                  <span>{medPriorityCount} ราย ({Math.round((medPriorityCount / totalCustomers) * 100)}%)</span>
                </div>
                <div style={{ height: "8px", backgroundColor: "var(--slate-100)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${(medPriorityCount / totalCustomers) * 100}%`, height: "100%", backgroundColor: "var(--priority-med-solid)", borderRadius: "4px" }} />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-xs)", fontWeight: 700, marginBottom: "4px" }}>
                  <span style={{ color: "var(--slate-600)" }}>💤 ความสำคัญต่ำ (Low)</span>
                  <span>{lowPriorityCount} ราย ({Math.round((lowPriorityCount / totalCustomers) * 100)}%)</span>
                </div>
                <div style={{ height: "8px", backgroundColor: "var(--slate-100)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${(lowPriorityCount / totalCustomers) * 100}%`, height: "100%", backgroundColor: "var(--slate-400)", borderRadius: "4px" }} />
                </div>
              </div>
            </div>

            {/* Need Category Distribution */}
            {needs?.categories_distribution && needs.categories_distribution.length > 0 && (
              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "var(--space-3)" }}>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--slate-700)", marginBottom: "8px" }}>
                  จำแนกตามกลุ่มความต้องการประกัน (Identified Needs):
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {needs.categories_distribution.map((cat) => (
                    <div
                      key={cat.category}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "var(--slate-50)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "var(--fs-xs)",
                        display: "flex",
                        gap: "6px",
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{cat.label_th || cat.category}:</span>
                      <strong>{cat.count} ราย</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* ── Section B: Recommendation Decisions Breakdown ── */}
        <Card
          title="🛡️ ผลการตัดสินใจเลือกผลิตภัณฑ์ (Broker Decisions)"
          subtitle="สถิติการยอมรับ ปรับเปลี่ยน หรือปฏิเสธคำแนะนำจากโมเดล Product Matcher"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {/* Visual Stacked Progress Bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginBottom: "6px" }}>
                <span>สัดส่วนการตัดสินใจของนายหน้า (Decision Split)</span>
                <span>รวม {totalDecisions} รายการ</span>
              </div>
              <div style={{ height: "10px", borderRadius: "999px", overflow: "hidden", display: "flex", backgroundColor: "var(--slate-100)" }}>
                <div style={{ width: `${approvalRate}%`, backgroundColor: "#10b981", transition: "width 0.4s ease" }} title={`เห็นชอบ ${approvalRate}%`} />
                <div style={{ width: `${modificationRate}%`, backgroundColor: "#f59e0b", transition: "width 0.4s ease" }} title={`ปรับเปลี่ยน ${modificationRate}%`} />
                <div style={{ width: `${rejectionRate}%`, backgroundColor: "#ef4444", transition: "width 0.4s ease" }} title={`ปฏิเสธ ${rejectionRate}%`} />
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "6px", fontSize: "11px", color: "var(--slate-500)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981" }} /> เห็นชอบ ({approvalRate}%)</span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f59e0b" }} /> ปรับเปลี่ยน ({modificationRate}%)</span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ef4444" }} /> ปฏิเสธ ({rejectionRate}%)</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", textAlign: "center" }}>
              <div className="hover-lift" style={{ padding: "14px 12px", backgroundColor: "var(--success-bg)", border: "1px solid var(--success-border)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "var(--fs-2xl)", fontWeight: 800, color: "var(--success-solid)" }}>{approvalRate}%</div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--success-text)", marginTop: "2px" }}>เห็นชอบ (Approve)</div>
                <div style={{ fontSize: "11px", color: "var(--slate-500)", marginTop: "2px" }}>{recommendations?.approval_count ?? 0} รายการ</div>
              </div>

              <div className="hover-lift" style={{ padding: "14px 12px", backgroundColor: "var(--warning-bg)", border: "1px solid var(--warning-border)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "var(--fs-2xl)", fontWeight: 800, color: "var(--warning-solid)" }}>{modificationRate}%</div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--warning-text)", marginTop: "2px" }}>ปรับเปลี่ยน (Modify)</div>
                <div style={{ fontSize: "11px", color: "var(--slate-500)", marginTop: "2px" }}>{recommendations?.modification_count ?? 0} รายการ</div>
              </div>

              <div className="hover-lift" style={{ padding: "14px 12px", backgroundColor: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "var(--fs-2xl)", fontWeight: 800, color: "var(--danger-solid)" }}>{rejectionRate}%</div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--danger-text)", marginTop: "2px" }}>ปฏิเสธ (Reject)</div>
                <div style={{ fontSize: "11px", color: "var(--slate-500)", marginTop: "2px" }}>{recommendations?.rejection_count ?? 0} รายการ</div>
              </div>
            </div>

            {recommendations?.common_modification_reasons && Object.keys(recommendations.common_modification_reasons).length > 0 && (
              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "var(--space-3)" }}>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--slate-700)", marginBottom: "6px" }}>
                  เหตุผลสำคัญในการปรับเปลี่ยน / ปฏิเสธ:
                </div>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-600)", lineHeight: 1.6 }}>
                  {Object.entries(recommendations.common_modification_reasons).map(([reason, count]) => (
                    <div key={reason} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                      <span>• {reason}</span>
                      <strong>{Number(count)} ครั้ง</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* ── Section C: Follow-up Execution Pipeline ── */}
        <Card
          title="📋 ประสิทธิภาพงานติดตาม (Follow-up Pipeline)"
          subtitle="สถานะความคืบหน้าของนัดหมายและการติดต่อลูกค้า"
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
            <div className="hover-lift" style={{ padding: "14px", backgroundColor: "var(--primary-50)", borderRadius: "var(--radius-md)", border: "1px solid var(--primary-100)", textAlign: "center" }}>
              <div style={{ fontSize: "var(--fs-2xl)", fontWeight: 800, color: "var(--primary-700)" }}>
                {followups?.due_count ?? overview?.follow_ups_due ?? 0}
              </div>
              <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--slate-700)", marginTop: "4px" }}>
                งานที่รอติดตาม (Due)
              </div>
            </div>

            <div className="hover-lift" style={{ padding: "14px", backgroundColor: overdueFollowups > 0 ? "#fef2f2" : "var(--slate-50)", borderRadius: "var(--radius-md)", border: `1px solid ${overdueFollowups > 0 ? "#fecaca" : "var(--border-subtle)"}`, textAlign: "center" }}>
              <div style={{ fontSize: "var(--fs-2xl)", fontWeight: 800, color: overdueFollowups > 0 ? "var(--danger-solid)" : "var(--slate-400)" }}>
                {overdueFollowups}
              </div>
              <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: overdueFollowups > 0 ? "var(--danger-solid)" : "var(--slate-500)", marginTop: "4px" }}>
                เกินกำหนด (Overdue)
              </div>
            </div>

            <div className="hover-lift" style={{ padding: "14px", backgroundColor: "var(--success-bg)", borderRadius: "var(--radius-md)", border: "1px solid var(--success-border)", textAlign: "center" }}>
              <div style={{ fontSize: "var(--fs-2xl)", fontWeight: 800, color: "var(--success-solid)" }}>
                {completedFollowups}
              </div>
              <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--success-text)", marginTop: "4px" }}>
                เสร็จสิ้นแล้ว (Done)
              </div>
            </div>
          </div>
        </Card>

        {/* ── Section D: AI Workflow Activity Volume ── */}
        <Card
          title="🤖 ปริมาณการเรียกใช้งานระบบ AI (AI Usage Activity)"
          subtitle="จำนวนครั้งที่นายหน้าขอรับการสนับสนุนจากโมเดล AI แต่ละโมดูล"
        >
          <table style={{ width: "100%", fontSize: "var(--fs-sm)", borderCollapse: "collapse" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "10px 0", color: "var(--slate-600)" }}>⚡ AI Priority Scoring (LightGBM)</td>
                <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 700, color: "var(--slate-900)" }}>
                  {aiUsage?.total_ai_scoring_requests?.toLocaleString() ?? 0} ครั้ง
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "10px 0", color: "var(--slate-600)" }}>💡 LLM Customer Insight (Gemini/Claude)</td>
                <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 700, color: "var(--slate-900)" }}>
                  {aiUsage?.total_llm_insight_requests?.toLocaleString() ?? 0} ครั้ง
                </td>
              </tr>
              <tr>
                <td style={{ padding: "10px 0", color: "var(--slate-600)" }}>💬 AI Copilot Conversation Preparation</td>
                <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 700, color: "var(--slate-900)" }}>
                  {aiUsage?.total_conversation_requests?.toLocaleString() ?? 0} ครั้ง
                </td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>
    </AppShell>
  );
}
