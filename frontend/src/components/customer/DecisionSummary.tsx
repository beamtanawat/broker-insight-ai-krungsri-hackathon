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
      className="glass-card"
      style={{
        padding: "var(--space-4) var(--space-5)",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        border: "1px solid var(--border-subtle)",
        borderLeft: "4px solid var(--krungsri-yellow)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-card)",
        marginBottom: "var(--space-6)",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "var(--space-5)",
        alignItems: "center",
      }}
    >
      {/* 1. Priority */}
      <div data-tour="ai-insight" id="tour-ai-priority-card" style={{ borderRight: "1px solid var(--border-subtle)", paddingRight: "var(--space-4)" }}>
        <div style={{ fontSize: "14px", color: "var(--slate-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          ระดับความสำคัญ (Priority)
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
          <Badge variant={priority as any} size="sm">
            {priority === "high" ? "สูง (High)" : priority === "medium" ? "ปานกลาง" : "ต่ำ"}
          </Badge>
          <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--krungsri-navy)", letterSpacing: "-0.02em" }}>
            {Math.round(score)}<span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--slate-500)" }}>/100</span>
          </span>
        </div>
      </div>

      {/* 2. Key Driver */}
      <div style={{ borderRight: "1px solid var(--border-subtle)", paddingRight: "var(--space-4)" }}>
        <div style={{ fontSize: "14px", color: "var(--slate-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          ปัจจัยสำคัญหลัก (Key Driver)
        </div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--slate-800)", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          ⚡ {topReason}
        </div>
      </div>

      {/* 3. Top Recommendation */}
      <div data-tour="recommendation" id="tour-product-recommendations" style={{ borderRight: "1px solid var(--border-subtle)", paddingRight: "var(--space-4)" }}>
        <div style={{ fontSize: "14px", color: "var(--slate-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          ผลิตภัณฑ์แนะนำอันดับ 1
        </div>
        <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--krungsri-navy)", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          🛡️ {topRec ? topRec.product_name : "รอการประเมิน"}
        </div>
      </div>

      {/* 4. Suggested Next Action */}
      <div>
        <div style={{ fontSize: "14px", color: "var(--slate-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          การดำเนินการถัดไป (Next Action)
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginTop: "4px" }}>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--slate-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {nextAction}
          </span>
          <button
            onClick={() => {
              const targetTab = topRec ? "recommend" : "priority";
              onNavigateTab(targetTab);
              setTimeout(() => {
                const targetId = targetTab === "recommend" ? "recommendation-workspace" : "priority-workspace";
                const el = document.getElementById(targetId);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 120);
            }}
            style={{
              fontSize: "12px",
              color: "var(--krungsri-navy)",
              fontWeight: 800,
              cursor: "pointer",
              whiteSpace: "nowrap",
              padding: "5px 10px",
              borderRadius: "var(--radius-full)",
              background: "var(--krungsri-gold-gradient)",
              border: "1px solid rgba(254, 203, 0, 0.4)",
              boxShadow: "0 1px 3px rgba(254, 203, 0, 0.3)",
              transition: "all var(--motion-fast) ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 3px 8px rgba(254, 203, 0, 0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(254, 203, 0, 0.3)";
            }}
          >
            ดูทันที →
          </button>
        </div>
      </div>
    </div>
  );
}
