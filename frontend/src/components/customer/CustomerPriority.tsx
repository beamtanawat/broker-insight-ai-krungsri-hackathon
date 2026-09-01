"use client";
import React, { useState } from "react";
import type {
  CustomerDetail,
  AnalyzeCustomerResponse,
  LLMInsightResponse,
  CustomerNeedAnalysisResponse,
} from "@/types";
import {
  Card,
  Badge,
  Button,
  Drawer,
  Panel,
  Skeleton,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeadCell,
  TableCell,
} from "@/components/ui";
import { AILabel, PriorityScore } from "@/components/domain";

interface CustomerPriorityProps {
  customer: CustomerDetail;
  aiAnalysis: AnalyzeCustomerResponse | null;
  insights: LLMInsightResponse | null;
  needAnalysis: CustomerNeedAnalysisResponse | null;
  loading: boolean;
  onRefreshAnalysis: () => void;
  onSubmitFeedback?: (type: string, reason: string, comments: string) => Promise<void>;
}

const NEED_CATEGORY_LABELS: Record<string, string> = {
  health: "ความคุ้มครองสุขภาพ & ค่ารักษา (Health & Medical)",
  life: "ความคุ้มครองชีวิต & รายได้ครอบครัว (Life & Protection)",
  saving: "การออม & วางแผนเกษียณ (Savings & Retirement)",
  accident: "อุบัติเหตุ & การเดินทาง (Personal Accident)",
  property: "ทรัพย์สิน & อัคคีภัย (Property & Asset)",
};

export function CustomerPriority({
  customer,
  aiAnalysis,
  insights,
  needAnalysis,
  loading,
  onRefreshAnalysis,
}: CustomerPriorityProps) {
  const [showShapDrawer, setShowShapDrawer] = useState(false);

  const priority = aiAnalysis?.priority_level || customer.latest_score?.priority_level || "medium";
  const score = aiAnalysis?.score ?? customer.latest_score?.score_display ?? 0;
  const rawFactors = aiAnalysis?.factors || customer.latest_score?.feature_importance || [];
  const factors = rawFactors.map((f: any) => {
    const rawVal = typeof f.shap_value === "number"
      ? f.shap_value
      : (typeof f.impact === "number" ? f.impact : (typeof f.value === "number" ? f.value : 0));
    const isPositive = f.impact === "positive" || rawVal >= 0;
    return {
      feature: f.feature || "",
      label: f.label || f.feature || "ปัจจัยความสำคัญ",
      impact: isPositive ? "positive" : "negative",
      shap_value: typeof rawVal === "number" && !isNaN(rawVal) ? rawVal : 0,
      importance: Math.abs(typeof rawVal === "number" && !isNaN(rawVal) ? rawVal : 0),
    };
  });
  const topReasons = factors.slice(0, 3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* ── Top Priority Hero Strip ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "var(--space-5)",
          alignItems: "stretch",
        }}
      >
        {/* Priority Score Hero Card */}
        <Card variant="metric">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <AILabel type="ai" label="คะแนนความสำคัญจากโมเดล AI (ML Scored)" />
            <Button
              variant="ghost"
              size="sm"
              leftIcon="🔄"
              onClick={onRefreshAnalysis}
              isLoading={loading}
              style={{ color: "var(--primary-700)" }}
            >
              ประเมินซ้ำ
            </Button>
          </div>

          <div style={{ marginTop: "var(--space-4)" }}>
            <PriorityScore
              score={Math.round(score)}
              priority={priority}
              confidence="high"
              label="ระดับความสำคัญในการติดต่อลูกค้า"
            />
          </div>

          <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "var(--space-4)", lineHeight: 1.5 }}>
            คะแนนผ่านการปรับเทียบความน่าจะเป็น (Calibrated Probability) ให้สะท้อนโอกาสและความจำเป็นในการติดต่อจริง
          </div>
        </Card>

        {/* Top 3 Why Reasons Card */}
        <Card
          title="💡 เหตุผลที่ระบบจัดลำดับความสำคัญ (Top Drivers)"
          subtitle="ปัจจัยสำคัญที่มีผลต่อการให้คะแนนของลูกค้ารายนี้"
          headerAction={
            <Button
              variant="outline"
              size="sm"
              leftIcon="📊"
              onClick={() => setShowShapDrawer(true)}
            >
              ดูรายละเอียดการคำนวณ (SHAP)
            </Button>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {topReasons.length > 0 ? (
              topReasons.map((f, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 14px",
                    backgroundColor: f.impact === "positive" ? "var(--ai-bg)" : "var(--slate-50)",
                    border: `1px solid ${f.impact === "positive" ? "var(--ai-border)" : "var(--border-subtle)"}`,
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: f.impact === "positive" ? "#16a34a" : "#dc2626", fontWeight: 800 }}>
                      {f.impact === "positive" ? "▲" : "▼"}
                    </span>
                    <span style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--slate-800)" }}>
                      {f.label}
                    </span>
                  </div>
                  <Badge variant={f.impact === "positive" ? "success" : "neutral"} size="sm">
                    {f.impact === "positive" ? "เพิ่มโอกาส" : "ลดโอกาส"}
                  </Badge>
                </div>
              ))
            ) : (
              <div style={{ color: "var(--slate-500)", fontSize: "var(--fs-sm)", padding: "12px 0" }}>
                ระบบกำลังประมวลผลปัจจัยความสำคัญ...
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── AI Customer Insights Summary ── */}
      {insights && (
        <Panel
          variant="ai"
          label="AI Customer Insight (LLM Analysis)"
          title="สรุปภาพรวมและข้อควรสังเกตจากข้อมูลเชิงลึก"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <p style={{ margin: 0, fontSize: "var(--fs-base)", color: "var(--slate-800)", lineHeight: 1.6 }}>
              {insights.customer_summary}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-4)" }}>
              {/* Key Observations */}
              <div style={{ padding: "12px", backgroundColor: "var(--white)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontWeight: 700, fontSize: "var(--fs-sm)", color: "var(--slate-900)", marginBottom: "6px" }}>
                  🔍 ข้อสังเกตสำคัญ (Key Observations)
                </div>
                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "var(--fs-xs)", color: "var(--slate-700)", lineHeight: 1.6 }}>
                  {insights.key_observations?.map((obs, i) => (
                    <li key={i}>{obs}</li>
                  ))}
                </ul>
              </div>

              {/* Potential Needs */}
              <div style={{ padding: "12px", backgroundColor: "var(--white)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontWeight: 700, fontSize: "var(--fs-sm)", color: "var(--primary-700)", marginBottom: "6px" }}>
                  🎯 ความต้องการที่อาจต้องทบทวน (Potential Needs)
                </div>
                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "var(--fs-xs)", color: "var(--slate-700)", lineHeight: 1.6 }}>
                  {insights.potential_needs?.map((need, i) => (
                    <li key={i}>{need}</li>
                  ))}
                </ul>
              </div>

              {/* Cautions */}
              <div style={{ padding: "12px", backgroundColor: "var(--white)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontWeight: 700, fontSize: "var(--fs-sm)", color: "var(--danger-text)", marginBottom: "6px" }}>
                  ⚠️ ข้อควรระวัง (Cautions)
                </div>
                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "var(--fs-xs)", color: "var(--slate-700)", lineHeight: 1.6 }}>
                  {insights.cautions?.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* ── Potential Needs Analysis (5 Categories) ── */}
      <Card
        title="🎯 การวิเคราะห์ความต้องการ 5 ด้าน (Need Analysis)"
        subtitle="ประเมินความต้องการตามช่วงชีวิต พอร์ตประกันเดิม และความคุ้มครองที่ยังขาดหาย"
      >
        {needAnalysis?.needs && needAnalysis.needs.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-4)" }}>
            {needAnalysis.needs.map((item) => (
              <div
                key={item.category}
                style={{
                  padding: "14px",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: item.severity === "high" ? "#fffbeb" : "var(--bg-surface-subtle)",
                  borderLeft: `4px solid ${item.severity === "high" ? "#d97706" : item.severity === "medium" ? "#3b82f6" : "var(--slate-300)"}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: "var(--fs-sm)", color: "var(--slate-900)" }}>
                    {NEED_CATEGORY_LABELS[item.category] || item.label_th || item.category}
                  </span>
                  <Badge variant={item.severity as any} size="sm">
                    {item.severity === "high" ? "ความต้องการสูง" : item.severity === "medium" ? "ปานกลาง" : "ต่ำ"}
                  </Badge>
                </div>

                <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-600)", lineHeight: 1.5 }}>
                  {item.explanation}
                </div>

                {item.supporting_signals && item.supporting_signals.length > 0 && (
                  <div style={{ fontSize: "11px", color: "var(--slate-500)", borderTop: "1px solid var(--border-subtle)", paddingTop: "6px" }}>
                    สัญญาณ: {item.supporting_signals.join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--slate-500)" }}>
            {loading ? <Skeleton height="80px" /> : "ยังไม่มีข้อมูลการวิเคราะห์ความต้องการ"}
          </div>
        )}
      </Card>

      {/* ── Progressive Disclosure: SHAP Calculation Detail Drawer ── */}
      <Drawer
        isOpen={showShapDrawer}
        onClose={() => setShowShapDrawer(false)}
        title="การคำนวณและปัจจัยโมเดล AI (SHAP Factors)"
        subtitle="รายละเอียดทางสถิติของโมเดล LightGBM ที่ใช้ประเมินคะแนนลูกค้ารายนี้"
        width="560px"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-600)", lineHeight: 1.5, backgroundColor: "var(--slate-50)", padding: "12px", borderRadius: "var(--radius-md)" }}>
            SHAP (SHapley Additive exPlanations) แสดงผลกระทบของแต่ละฟีเจอร์ต่อคะแนนความสำคัญ ค่าบวกเพิ่มโอกาสในการติดต่อ ค่าลบลดโอกาส
          </div>

          <Table density="compact">
            <TableHeader>
              <TableRow hover={false}>
                <TableHeadCell>ฟีเจอร์ (Feature)</TableHeadCell>
                <TableHeadCell align="center">ทิศทาง</TableHeadCell>
                <TableHeadCell align="right">ผลกระทบ (SHAP Value)</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {factors.map((f, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <div style={{ fontWeight: 600, fontSize: "var(--fs-xs)" }}>{f.label}</div>
                    <div style={{ fontSize: "10px", color: "var(--slate-400)" }}>{f.feature}</div>
                  </TableCell>
                  <TableCell align="center">
                    <span style={{ color: f.impact === "positive" ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                      {f.impact === "positive" ? "+ เพิ่มโอกาส" : "- ลดโอกาส"}
                    </span>
                  </TableCell>
                  <TableCell align="right">
                    <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "var(--fs-xs)" }}>
                      {typeof f.shap_value === "number" && !isNaN(f.shap_value)
                        ? (f.shap_value > 0 ? `+${f.shap_value.toFixed(4)}` : f.shap_value.toFixed(4))
                        : "0.0000"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {aiAnalysis?.model_metadata && (
            <div style={{ fontSize: "11px", color: "var(--slate-400)", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
              โมเดล: {aiAnalysis.model_metadata.model_name} (v{aiAnalysis.model_metadata.model_version}) · {aiAnalysis.model_metadata.timestamp}
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}
