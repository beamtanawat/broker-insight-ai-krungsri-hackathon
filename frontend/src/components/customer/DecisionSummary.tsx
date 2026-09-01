import React from "react";
import type { CustomerDetail, AnalyzeCustomerResponse, CustomerRecommendationsResponse } from "@/types";
import { Badge } from "@/components/ui";

interface DecisionSummaryProps {
  customer: CustomerDetail;
  aiAnalysis: AnalyzeCustomerResponse | null;
  recommendations: CustomerRecommendationsResponse | null;
  onNavigateTab: (tabId: string) => void;
}

/**
 * Compact Decision Summary Bar:
 * Gives a 10-second high-level brief of Priority, Reason, Potential Need, Top Recommendation, and Next Action.
 */
export function DecisionSummary({
  customer,
  aiAnalysis,
  recommendations,
  onNavigateTab,
}: DecisionSummaryProps) {
  const priority = aiAnalysis?.priority_level || customer.latest_score?.priority_level || "medium";
  const score = aiAnalysis?.score || customer.latest_score?.score_display || 0;
  const topRec = recommendations?.recommendations?.[0];
  const topReason = aiAnalysis?.factors?.[0]?.label || customer.latest_score?.feature_importance?.[0]?.label || "รอบทบทวนความคุ้มครองประจำปี";

  const hasOverdue = customer.follow_ups?.some((f) => f.payment_status === "overdue" && f.status === "open");
  const nextAction = hasOverdue
    ? "ติดต่อติดตามผลงานค้าง"
    : topRec
    ? `นำเสนอ ${topRec.product_name}`
    : "วิเคราะห์ความต้องการลูกค้า";

  return (
    <div
      style={{
        padding: "var(--space-4) var(--space-5)",
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-xs)",
        marginBottom: "var(--space-6)",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "var(--space-4)",
        alignItems: "center",
      }}
    >
      {/* 1. Priority */}
      <div style={{ borderRight: "1px solid var(--border-subtle)", paddingRight: "var(--space-3)" }}>
        <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", fontWeight: 600, textTransform: "uppercase" }}>
          ระดับความสำคัญ
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
          <Badge variant={priority as any} size="sm">
            {priority === "high" ? "สูง (High)" : priority === "medium" ? "ปานกลาง" : "ต่ำ"}
          </Badge>
          <span style={{ fontSize: "var(--fs-md)", fontWeight: 800, color: "var(--slate-900)" }}>
            {Math.round(score)}/100
          </span>
        </div>
      </div>

      {/* 2. Key Driver */}
      <div style={{ borderRight: "1px solid var(--border-subtle)", paddingRight: "var(--space-3)" }}>
        <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", fontWeight: 600, textTransform: "uppercase" }}>
          ปัจจัยสำคัญหลัก
        </div>
        <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--slate-800)", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {topReason}
        </div>
      </div>

      {/* 3. Top Recommendation */}
      <div style={{ borderRight: "1px solid var(--border-subtle)", paddingRight: "var(--space-3)" }}>
        <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", fontWeight: 600, textTransform: "uppercase" }}>
          ผลิตภัณฑ์แนะนำอันดับ 1
        </div>
        <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--primary-700)", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {topRec ? topRec.product_name : "รอการประเมิน"}
        </div>
      </div>

      {/* 4. Suggested Next Action */}
      <div>
        <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", fontWeight: 600, textTransform: "uppercase" }}>
          การดำเนินการถัดไป
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginTop: "4px" }}>
          <span style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--slate-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {nextAction}
          </span>
          <button
            onClick={() => onNavigateTab(topRec ? "recommend" : "priority")}
            style={{
              fontSize: "var(--fs-xs)",
              color: "var(--primary-700)",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              padding: "2px 6px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--primary-50)",
            }}
          >
            ดูทันที →
          </button>
        </div>
      </div>
    </div>
  );
}
