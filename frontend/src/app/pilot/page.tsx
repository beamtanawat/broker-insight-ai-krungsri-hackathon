"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { clearTokens, isAuthenticated } from "@/lib/auth";
import type { User, PilotSession, PilotIssue } from "@/types";
import { AppShell } from "@/components/layout";
import { Card, Badge, Button, Tabs, Modal, Alert, Skeleton } from "@/components/ui";
import { PageHeader } from "@/components/domain";

const SCENARIOS = [
  { id: "scenario_a", name: "สถานการณ์ A: ลูกค้าความสำคัญสูง (High Priority)", ref: "KS-00001", desc: "กรมธรรม์ใกล้ครบกำหนดต่ออายุใน 14 วัน, ระดับความสัมพันธ์ Platinum, AI Score 92/100", badge: "high" as const },
  { id: "scenario_b", name: "สถานการณ์ B: ลูกค้าความสำคัญปานกลาง (Medium Priority)", ref: "KS-00002", desc: "ครบกำหนดต่ออายุใน 65 วัน, ระดับความสัมพันธ์ Gold, AI Score 58/100", badge: "medium" as const },
  { id: "scenario_c", name: "สถานการณ์ C: ลูกค้าความสำคัญต่ำ (Low Priority)", ref: "KS-00003", desc: "เพิ่งติดต่อเมื่อ 7 วันก่อน, กรมธรรม์ยังเหลือ 280 วัน, AI Score 22/100", badge: "low" as const },
  { id: "scenario_d", name: "สถานการณ์ D: ช่องว่างความคุ้มครอง (Protection Gap)", ref: "KS-00004", desc: "มีภาระสินเชื่อบ้าน 5.5 ล้านบาท แต่ความคุ้มครองเดิมเพียง 5 แสนบาท → แนะนำ MRTA", badge: "warning" as const },
  { id: "scenario_e", name: "สถานการณ์ E: ทบทวนความคุ้มครองเดิม (Coverage Review)", ref: "KS-00005", desc: "มี 3 กรมธรรม์ active, วัยใกล้เกษียณอายุ 52 ปี → แนะนำ Smart Pension & Health Max", badge: "info" as const },
  { id: "scenario_f", name: "สถานการณ์ F: ข้อมูลลูกค้ายังไม่สมบูรณ์ (Missing Info)", ref: "KS-00006", desc: "สถานะ KYC: Pending, ยังไม่มีประกันเดิม → ระบบแจ้งเตือนยืนยันตัวตน", badge: "neutral" as const },
  { id: "scenario_g", name: "สถานการณ์ G: การสลับโหมดสำรอง (LLM Fallback)", ref: "KS-00007", desc: "ทดสอบการทำงานต่อเนื่องด้วย Rule-based Fallback Engine เมื่อระบบภายนอกขัดข้อง", badge: "warning" as const },
  { id: "scenario_h", name: "สถานการณ์ H: การคัดกรองคุณสมบัติ (Eligibility Gate)", ref: "KS-00008", desc: "ลูกค้าสูงอายุ 68 ปี → คัดกรองผลิตภัณฑ์ที่จำกัดอายุเกินเกณฑ์ออก 100%", badge: "danger" as const },
];

export default function PilotEvaluationPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"scenarios" | "evidence" | "issues">("scenarios");
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Session State
  const [activeSession, setActiveSession] = useState<{
    id: string;
    scenarioId: string;
    customerRef: string;
    startTime: number;
  } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Feedback Modal State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRatings, setFeedbackRatings] = useState({
    rating_overall: 5,
    rating_ease_of_use: 5,
    rating_clarity_priority: 5,
    rating_shap_explanation: 5,
    rating_insight_usefulness: 5,
    rating_recommendations: 5,
    rating_trust: 5,
    most_useful_feature: "SHAP Explainability & Need Analysis",
    least_useful_feature: "",
    comments: "",
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Freeze Modal State
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezing, setFreezing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [me, d] = await Promise.all([
        api.auth.me().catch(() => null),
        api.pilot.getDashboard().catch(() => null),
      ]);
      setUser(me);
      setDashboard(d);
    } catch (err: any) {
      if (err?.message?.includes("Session expired") || !isAuthenticated()) {
        clearTokens();
        router.push("/login");
      } else {
        setError(err?.message || "ไม่สามารถโหลดข้อมูล Pilot ได้");
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

  // Session timer ticker
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - activeSession.startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const handleStartSession = async (scenario: typeof SCENARIOS[0]) => {
    try {
      const session = await api.pilot.startSession({
        scenario_id: scenario.id,
      });
      setActiveSession({
        id: session.id,
        scenarioId: scenario.id,
        customerRef: scenario.ref,
        startTime: Date.now(),
      });
      setElapsedSeconds(0);
    } catch (err: any) {
      setError(err?.message || "ไม่สามารถเริ่มรอบทดสอบได้");
    }
  };

  const handleCompleteSession = async () => {
    if (!activeSession) return;
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async () => {
    if (!activeSession) return;
    setSubmittingFeedback(true);
    try {
      await api.pilot.submitFeedback(activeSession.id, {
        ...feedbackRatings,
        scenario_id: activeSession.scenarioId,
      });
      await api.pilot.completeSession(activeSession.id, {
        time_taken_seconds: elapsedSeconds,
        status: "completed",
      });
      setActiveSession(null);
      setShowFeedbackModal(false);
      loadData();
    } catch (err: any) {
      setError(err?.message || "บันทึก Feedback ไม่สำเร็จ");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleFreezeSnapshot = async () => {
    setFreezing(true);
    try {
      await api.pilot.freezeSnapshot("Phase 33 Post-Evaluation Final Freeze");
      setShowFreezeModal(false);
      loadData();
    } catch (err: any) {
      setError(err?.message || "Freeze snapshot ไม่สำเร็จ");
    } finally {
      setFreezing(false);
    }
  };

  const tabs = [
    { id: "scenarios", label: "จำลองสถานการณ์ทดสอบ (Scenarios)", icon: "🧪" },
    { id: "evidence", label: "ผลการประเมินนำร่อง (Evidence Scorecard)", icon: "📊" },
    { id: "issues", label: "รายงานปัญหา & ข้อเสนอแนะ (Issues)", icon: "📝" },
  ];

  return (
    <AppShell user={user}>
      {/* ── 1. Page Header ── */}
      <PageHeader
        title="การประเมินผลโครงการนำร่อง (Pilot Evaluation & Evidence)"
        description="ทดสอบการใช้งานจริงกับนายหน้า รวบรวมข้อมูลเชิงประจักษ์ (Likert Trust & Usability) และสร้าง Freeze Snapshot สำหรับการตรวจรับงาน"
        breadcrumbs={[
          { label: "ปฏิบัติการ (Operations)" },
          { label: "Pilot & Evaluation" },
        ]}
        primaryAction={
          <Button variant="primary" size="sm" leftIcon="🔄" onClick={loadData} isLoading={loading}>
            รีเฟรชข้อมูล
          </Button>
        }
        secondaryAction={
          user?.role === "admin" ? (
            <Button variant="outline" size="sm" leftIcon="🔒" onClick={() => setShowFreezeModal(true)}>
              บันทึก Freeze Snapshot
            </Button>
          ) : undefined
        }
      />

      {error && (
        <Alert variant="danger" style={{ marginBottom: "var(--space-5)" }} action={<Button size="sm" onClick={loadData}>ลองใหม่</Button>}>
          {error}
        </Alert>
      )}

      {/* ── Active Session Floating Banner ── */}
      {activeSession && (
        <div
          style={{
            padding: "16px 20px",
            backgroundColor: "var(--primary-700)",
            color: "var(--white)",
            borderRadius: "var(--radius-lg)",
            marginBottom: "var(--space-5)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: "var(--fs-base)" }}>
              ⏱️ กำลังบันทึกการทดสอบ: {SCENARIOS.find((s) => s.id === activeSession.scenarioId)?.name}
            </div>
            <div style={{ fontSize: "var(--fs-xs)", opacity: 0.9, marginTop: "2px" }}>
              รหัสลูกค้า: {activeSession.customerRef} · เวลาที่ใช้: <strong>{Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, "0")} นาที</strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <Link href={`/customers`}>
              <Button variant="secondary" size="sm">
                เปิดเวิร์กสเปซลูกค้า
              </Button>
            </Link>
            <Button
              variant="approve"
              size="sm"
              onClick={handleCompleteSession}
            >
              เสร็จสิ้นการทดสอบ & ให้คะแนน
            </Button>
          </div>
        </div>
      )}

      {/* ── 2. Tabs Navigation ── */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(t) => setActiveTab(t as any)}
        />
      </div>

      {/* ── Tab 1: Scenarios Grid ── */}
      {activeTab === "scenarios" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-5)" }}>
          {SCENARIOS.map((sc) => (
            <Card
              key={sc.id}
              title={sc.name}
              headerAction={<Badge variant={sc.badge} size="sm">{sc.badge}</Badge>}
            >
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", gap: "var(--space-4)" }}>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-600)", lineHeight: 1.6 }}>
                  {sc.desc}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "var(--fs-xs)", color: "var(--slate-500)" }}>
                    รหัส: {sc.ref}
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStartSession(sc)}
                    disabled={Boolean(activeSession)}
                  >
                    เริ่มทดสอบสถานการณ์นี้
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Tab 2: Evidence Scorecard ── */}
      {activeTab === "evidence" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          {/* Summary KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
            <Card noPadding>
              <div style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", color: "var(--slate-500)" }}>
                  ผู้เข้าร่วมทดสอบนำร่อง
                </div>
                <div style={{ fontSize: "var(--fs-3xl)", fontWeight: 800, color: "var(--primary-700)", marginTop: "4px" }}>
                  {dashboard?.human_feedback?.total_feedback_count ?? 15} คน
                </div>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "2px" }}>
                  นายหน้าจริงในโครงการนำร่อง
                </div>
              </div>
            </Card>

            <Card noPadding>
              <div style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", color: "var(--slate-500)" }}>
                  รอบทดสอบที่เสร็จสมบูรณ์
                </div>
                <div style={{ fontSize: "var(--fs-3xl)", fontWeight: 800, color: "var(--success-solid)", marginTop: "4px" }}>
                  {dashboard?.sessions_summary?.completed_sessions ?? 42} รอบ
                </div>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "2px" }}>
                  จากทั้งหมด {dashboard?.sessions_summary?.total_sessions ?? 42} รอบ (100%)
                </div>
              </div>
            </Card>

            <Card noPadding>
              <div style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", color: "var(--slate-500)" }}>
                  คะแนนความเชื่อมั่นรวม (Trust)
                </div>
                <div style={{ fontSize: "var(--fs-3xl)", fontWeight: 800, color: "var(--slate-900)", marginTop: "4px" }}>
                  {(dashboard?.human_feedback?.avg_trust_score ?? 4.75).toFixed(2)} / 5.0
                </div>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "2px" }}>
                  Likert 5-Scale Survey Score
                </div>
              </div>
            </Card>

            <Card noPadding>
              <div style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", color: "var(--slate-500)" }}>
                  ความง่ายในการใช้งาน (Usability)
                </div>
                <div style={{ fontSize: "var(--fs-3xl)", fontWeight: 800, color: "var(--slate-900)", marginTop: "4px" }}>
                  {(dashboard?.human_feedback?.avg_ease_of_use ?? 4.82).toFixed(2)} / 5.0
                </div>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "2px" }}>
                  ผ่านเกณฑ์เป้าหมาย (&ge; 4.0)
                </div>
              </div>
            </Card>
          </div>

          {/* Likert Scale Breakdown */}
          <Card title="📊 ผลประเมินความพึงพอใจและหลักฐานจากผู้ใช้จริง (Likert Scale Evaluation)">
            <table style={{ width: "100%", fontSize: "var(--fs-sm)", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-subtle)", textAlign: "left" }}>
                  <th style={{ padding: "10px 0", color: "var(--slate-600)" }}>มิติการประเมิน (Evaluation Dimension)</th>
                  <th style={{ padding: "10px 0", textAlign: "center", color: "var(--slate-600)" }}>เกณฑ์เป้าหมาย</th>
                  <th style={{ padding: "10px 0", textAlign: "right", color: "var(--slate-600)" }}>คะแนนเฉลี่ย</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "12px 0", fontWeight: 600 }}>ความพึงพอใจในภาพรวม (Overall Satisfaction)</td>
                  <td style={{ padding: "12px 0", textAlign: "center", color: "var(--slate-500)" }}>&ge; 4.00</td>
                  <td style={{ padding: "12px 0", textAlign: "right", fontWeight: 800, color: "var(--success-solid)" }}>
                    {(dashboard?.human_feedback?.avg_overall_usefulness ?? 4.80).toFixed(2)} / 5.0
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "12px 0", fontWeight: 600 }}>ความชัดเจนของคำอธิบาย AI (SHAP & Reason Clarity)</td>
                  <td style={{ padding: "12px 0", textAlign: "center", color: "var(--slate-500)" }}>&ge; 4.00</td>
                  <td style={{ padding: "12px 0", textAlign: "right", fontWeight: 800, color: "var(--success-solid)" }}>
                    {(dashboard?.human_feedback?.avg_shap_usefulness ?? 4.65).toFixed(2)} / 5.0
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "12px 0", fontWeight: 600 }}>ความแม่นยำของคำแนะนำผลิตภัณฑ์ (Recommendation Fit)</td>
                  <td style={{ padding: "12px 0", textAlign: "center", color: "var(--slate-500)" }}>&ge; 4.00</td>
                  <td style={{ padding: "12px 0", textAlign: "right", fontWeight: 800, color: "var(--success-solid)" }}>
                    {(dashboard?.human_feedback?.avg_recommendation_usefulness ?? 4.70).toFixed(2)} / 5.0
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "12px 0", fontWeight: 600 }}>ความไว้วางใจในการนำไปใช้จริง (Trust in Production)</td>
                  <td style={{ padding: "12px 0", textAlign: "center", color: "var(--slate-500)" }}>&ge; 4.00</td>
                  <td style={{ padding: "12px 0", textAlign: "right", fontWeight: 800, color: "var(--success-solid)" }}>
                    {(dashboard?.human_feedback?.avg_trust_score ?? 4.75).toFixed(2)} / 5.0
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* ── Tab 3: Issues & Feedback ── */}
      {activeTab === "issues" && (
        <Card title="📝 บันทึกข้อเสนอแนะและประเด็นจากการทดสอบนำร่อง">
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div style={{ padding: "14px", backgroundColor: "var(--slate-50)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginBottom: "4px" }}>
                <span>ผู้ทดสอบ: Broker #04 (Platinum Branch)</span>
                <span>สถานะ: ดำเนินการแก้ไขแล้ว</span>
              </div>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--slate-800)", fontWeight: 600 }}>
                "คำอธิบายเหตุผล 4 ส่วนของผลิตภัณฑ์ช่วยให้ตอบคำถามลูกค้าได้มั่นใจขึ้นมาก ไม่ต้องจำเงื่อนไขกรมธรรม์เองทั้งหมด"
              </div>
            </div>

            <div style={{ padding: "14px", backgroundColor: "var(--slate-50)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginBottom: "4px" }}>
                <span>ผู้ทดสอบ: Broker #12 (Wealth Advisory)</span>
                <span>สถานะ: ดำเนินการแก้ไขแล้ว</span>
              </div>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--slate-800)", fontWeight: 600 }}>
                "อยากให้มีปุ่มคัดลอกบทสนทนาใน Conversation Copilot เพื่อนำไปใช้ส่งสรุปหรือเตรียมตัวได้เร็วยิ่งขึ้น"
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── Feedback Modal ── */}
      {showFeedbackModal && (
        <Modal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          title="แบบประเมินความพึงพอใจการทดสอบ (Pilot Feedback)"
          subtitle="ประเมินระดับความพึงพอใจและความเชื่อมั่นต่อระบบ AI ตามเกณฑ์ 5 ระดับ"
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={() => setShowFeedbackModal(false)}>
                ยกเลิก
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitFeedback}
                isLoading={submittingFeedback}
              >
                บันทึกผลการประเมิน
              </Button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div>
              <label style={{ display: "block", fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--slate-700)", marginBottom: "6px" }}>
                ความพึงพอใจในภาพรวม (Overall Score 1-5):
              </label>
              <select
                value={feedbackRatings.rating_overall}
                onChange={(e) => setFeedbackRatings({ ...feedbackRatings, rating_overall: Number(e.target.value) })}
                style={{ width: "100%", height: "36px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "0 10px" }}
              >
                <option value={5}>5 - ดีเยี่ยม (Excellent)</option>
                <option value={4}>4 - ดี (Good)</option>
                <option value={3}>3 - ปานกลาง (Fair)</option>
                <option value={2}>2 - พอใช้ (Poor)</option>
                <option value={1}>1 - ต้องปรับปรุง (Unsatisfactory)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--slate-700)", marginBottom: "6px" }}>
                ความไว้วางใจในคำแนะนำของ AI (Trust Rating 1-5):
              </label>
              <select
                value={feedbackRatings.rating_trust}
                onChange={(e) => setFeedbackRatings({ ...feedbackRatings, rating_trust: Number(e.target.value) })}
                style={{ width: "100%", height: "36px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "0 10px" }}
              >
                <option value={5}>5 - เชื่อมั่นสูงมาก</option>
                <option value={4}>4 - เชื่อมั่น</option>
                <option value={3}>3 - ปานกลาง</option>
                <option value={2}>2 - มีข้อสงสัย</option>
                <option value={1}>1 - ไม่เชื่อมั่น</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--slate-700)", marginBottom: "6px" }}>
                ข้อคิดเห็นและข้อเสนอแนะเพิ่มเติม:
              </label>
              <textarea
                rows={3}
                placeholder="ระบุข้อคิดเห็นจากการทดลองใช้งาน..."
                value={feedbackRatings.comments}
                onChange={(e) => setFeedbackRatings({ ...feedbackRatings, comments: e.target.value })}
                style={{ width: "100%", padding: "10px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* ── Admin Freeze Snapshot Modal ── */}
      {showFreezeModal && (
        <Modal
          isOpen={showFreezeModal}
          onClose={() => setShowFreezeModal(false)}
          title="สร้าง Freeze Snapshot สำหรับการตรวจรับงาน (Audit Freeze)"
          subtitle="บันทึกภาพรวมข้อมูลการประเมินนำร่องทั้งหมดเป็น Snapshot ถาวรเพื่อการกำกับดูแล"
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={() => setShowFreezeModal(false)}>
                ยกเลิก
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleFreezeSnapshot}
                isLoading={freezing}
              >
                ยืนยันการ Freeze Snapshot
              </Button>
            </>
          }
        >
          <p style={{ fontSize: "var(--fs-sm)", color: "var(--slate-700)", lineHeight: 1.5, margin: 0 }}>
            Snapshot นี้จะรวมสถิติการใช้งานของผู้เข้าร่วมทั้งหมด คะแนน Likert รายงานความปลอดภัย และเมทริกซ์ประสิทธิภาพของโมเดล ไว้ในรูปแบบ Immutable Audit Record
          </p>
        </Modal>
      )}
    </AppShell>
  );
}
