"use client";
import React from "react";

export type AdvisorOutcome = "no_action" | "review" | "action";

export interface TrustedAdvisorBadgeProps {
  outcome: AdvisorOutcome;
  label?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  pulse?: boolean;
}

const OUTCOME_CONFIG: Record<
  AdvisorOutcome,
  {
    bg: string;
    border: string;
    text: string;
    icon: string;
    defaultLabel: string;
    description: string;
    dotColor: string;
  }
> = {
  no_action: {
    bg: "rgba(16, 185, 129, 0.1)",
    border: "rgba(16, 185, 129, 0.3)",
    text: "#065f46",
    icon: "🟢",
    defaultLabel: "ยังไม่ต้องทำอะไร (No Action)",
    description: "ความคุ้มครองปัจจุบันเพียงพอแล้ว เหมาะสมกับสถานการณ์ปัจจุบัน",
    dotColor: "#10b981",
  },
  review: {
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.35)",
    text: "#92400e",
    icon: "🟡",
    defaultLabel: "ควรทบทวน (Review)",
    description: "มีเงื่อนไขหรือสิทธิบางอย่างเปลี่ยนไป ควรตรวจสอบช่องว่างความคุ้มครอง",
    dotColor: "#f59e0b",
  },
  action: {
    bg: "rgba(37, 99, 235, 0.12)",
    border: "rgba(37, 99, 235, 0.35)",
    text: "#1e40af",
    icon: "🔵",
    defaultLabel: "ต้องดำเนินการ (Action)",
    description: "ถึงจังหวะเวลาเร่งด่วน เช่น ใกล้หมดอายุ หรือมี Gap สำคัญที่ต้องตัดสินใจ",
    dotColor: "#2563eb",
  },
};

export function TrustedAdvisorBadge({
  outcome,
  label,
  size = "md",
  showIcon = true,
  pulse = false,
}: TrustedAdvisorBadgeProps) {
  const config = OUTCOME_CONFIG[outcome] || OUTCOME_CONFIG.no_action;
  const displayLabel = label || config.defaultLabel;

  const fontSizes = { sm: "11px", md: "12px", lg: "13px" };
  const paddings = { sm: "2px 8px", md: "4px 10px", lg: "6px 14px" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        color: config.text,
        borderRadius: "9999px",
        fontSize: fontSizes[size],
        fontWeight: 700,
        padding: paddings[size],
        whiteSpace: "nowrap",
        letterSpacing: "0.01em",
        lineHeight: 1.4,
      }}
      title={config.description}
    >
      {showIcon && <span>{config.icon}</span>}
      {pulse && (
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: config.dotColor,
            boxShadow: `0 0 6px ${config.dotColor}`,
          }}
        />
      )}
      <span>{displayLabel}</span>
    </span>
  );
}

export interface TrustedAdvisorCardProps {
  category: "health" | "motor" | "life_debt" | "savings_tax";
  title: string;
  subtitle: string;
  currentStatus: string;
  outcome: AdvisorOutcome;
  advisorReason: string;
  whyNowTrigger?: string;
  gapAnalysis?: {
    current: string;
    benchmark: string;
    gapDescription: string;
  };
  recommendedNextStep?: string;
  primaryActionLabel?: string;
  onActionClick?: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  health: "🏥",
  motor: "🚗",
  life_debt: "🛡️",
  savings_tax: "💰",
};

export function TrustedAdvisorCard({
  category,
  title,
  subtitle,
  currentStatus,
  outcome,
  advisorReason,
  whyNowTrigger,
  gapAnalysis,
  recommendedNextStep,
  primaryActionLabel,
  onActionClick,
}: TrustedAdvisorCardProps) {
  const config = OUTCOME_CONFIG[outcome];

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: `1px solid ${config.border}`,
        borderRadius: "16px",
        padding: "20px",
        boxShadow: "0 4px 16px rgba(11, 30, 54, 0.04)",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      {/* Top indicator stripe */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          backgroundColor: config.dotColor,
        }}
      />

      {/* Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              backgroundColor: config.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              flexShrink: 0,
            }}
          >
            {CATEGORY_ICONS[category] || "📋"}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0b1e36" }}>{title}</h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--slate-500)" }}>{subtitle}</p>
          </div>
        </div>
        <TrustedAdvisorBadge outcome={outcome} size="md" pulse={outcome === "action"} />
      </div>

      {/* Current Status Box */}
      <div
        style={{
          backgroundColor: "rgba(11, 30, 54, 0.02)",
          border: "1px solid rgba(11, 30, 54, 0.06)",
          borderRadius: "10px",
          padding: "10px 14px",
          fontSize: "13px",
          color: "var(--slate-700)",
        }}
      >
        <span style={{ fontWeight: 700, color: "#0b1e36" }}>สถานะปัจจุบัน: </span>
        {currentStatus}
      </div>

      {/* Gap Analysis Box (if exists) */}
      {gapAnalysis && (
        <div
          style={{
            backgroundColor: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "10px",
            padding: "12px",
            fontSize: "12px",
            color: "#92400e",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
            <span>🔍</span> การวิเคราะห์ช่องว่าง (Coverage Gap):
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "6px" }}>
            <div>
              <span style={{ color: "#78350f" }}>สิทธิปัจจุบัน: </span>
              <strong>{gapAnalysis.current}</strong>
            </div>
            <div>
              <span style={{ color: "#78350f" }}>ค่ารักษาจริง/มาตรฐาน: </span>
              <strong>{gapAnalysis.benchmark}</strong>
            </div>
          </div>
          <p style={{ margin: "6px 0 0", fontStyle: "italic", color: "#b45309" }}>
            ⚠️ {gapAnalysis.gapDescription}
          </p>
        </div>
      )}

      {/* Why Now Trigger (if exists) */}
      {whyNowTrigger && (
        <div
          style={{
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "10px",
            padding: "10px 14px",
            fontSize: "13px",
            color: "#1e40af",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "16px" }}>🔔</span>
          <span>
            <strong>ทำไมต้องตอนนี้ (Why now?):</strong> {whyNowTrigger}
          </span>
        </div>
      )}

      {/* Advisor Reason */}
      <div style={{ fontSize: "13px", lineHeight: 1.5, color: "var(--slate-600)" }}>
        <strong style={{ color: "#0b1e36" }}>มุมมองที่ปรึกษา (Advisor Perspective): </strong>
        {advisorReason}
      </div>

      {/* Next Step & Action */}
      {recommendedNextStep && (
        <div
          style={{
            marginTop: "auto",
            paddingTop: "12px",
            borderTop: "1px solid rgba(11, 30, 54, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div style={{ fontSize: "12px", color: "var(--slate-500)" }}>
            <span style={{ fontWeight: 700, color: "#0b1e36" }}>คำแนะนำถัดไป: </span>
            {recommendedNextStep}
          </div>
          {primaryActionLabel && onActionClick && (
            <button
              onClick={onActionClick}
              style={{
                backgroundColor: outcome === "action" ? "#2563eb" : outcome === "review" ? "#d97706" : "#059669",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "7px 14px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              }}
            >
              {primaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function TrustedAdvisorFrameworkBanner() {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "14px",
        padding: "16px 20px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(11, 30, 54, 0.03)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "18px" }}>🤝</span>
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#0b1e36" }}>
              Krungsri Trusted Advisor Framework
            </h4>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 800,
                backgroundColor: "var(--krungsri-yellow)",
                color: "#0b1e36",
                padding: "2px 8px",
                borderRadius: "9999px",
              }}
            >
              3 Clear Outcomes
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--slate-600)" }}>
            เปลี่ยนจากการยัดเยียดขายประกัน (Sales Push) มาเป็นที่ปรึกษาที่จริงใจและโปร่งใส ให้ลูกค้ารู้ว่าอะไรสำคัญ อะไรยังไม่ต้องทำ
          </p>
        </div>

        {/* 3 Outcome Badges */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <TrustedAdvisorBadge outcome="no_action" size="sm" />
          <TrustedAdvisorBadge outcome="review" size="sm" />
          <TrustedAdvisorBadge outcome="action" size="sm" pulse />
        </div>
      </div>

      {/* 5-Stage Journey Flow */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginTop: "14px",
          paddingTop: "12px",
          borderTop: "1px solid rgba(11, 30, 54, 0.06)",
          overflowX: "auto",
          fontSize: "11px",
        }}
      >
        <span style={{ fontWeight: 700, color: "var(--slate-500)", whiteSpace: "nowrap" }}>Journey Flow:</span>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
          <span style={{ backgroundColor: "#f1f5f9", padding: "3px 8px", borderRadius: "6px", fontWeight: 600, color: "#334155" }}>
            👤 Gen Z Customer
          </span>
          <span style={{ color: "#94a3b8" }}>→</span>
          <span style={{ backgroundColor: "#eff6ff", padding: "3px 8px", borderRadius: "6px", fontWeight: 600, color: "#1d4ed8" }}>
            📱 Digital Experience (My Protection)
          </span>
          <span style={{ color: "#94a3b8" }}>→</span>
          <span style={{ backgroundColor: "#fef3c7", padding: "3px 8px", borderRadius: "6px", fontWeight: 600, color: "#92400e" }}>
            🎯 Need / Intent (Life Event)
          </span>
          <span style={{ color: "#94a3b8" }}>→</span>
          <span style={{ backgroundColor: "#f3e8ff", padding: "3px 8px", borderRadius: "6px", fontWeight: 700, color: "#6b21a8" }}>
            🤖 Broker Insight AI (Why now?)
          </span>
          <span style={{ color: "#94a3b8" }}>→</span>
          <span style={{ backgroundColor: "#e0e7ff", padding: "3px 8px", borderRadius: "6px", fontWeight: 700, color: "#3730a3" }}>
            💼 Broker Trusted Advice
          </span>
          <span style={{ color: "#94a3b8" }}>→</span>
          <span style={{ backgroundColor: "#dcfce7", padding: "3px 8px", borderRadius: "6px", fontWeight: 700, color: "#166534" }}>
            ✅ Meaningful Follow-up
          </span>
        </div>
      </div>
    </div>
  );
}
