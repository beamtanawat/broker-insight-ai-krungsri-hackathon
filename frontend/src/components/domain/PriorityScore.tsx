import React from "react";
import { Tooltip } from "../ui/Tooltip";

export type PriorityLevel = "high" | "medium" | "low";

interface PriorityScoreProps {
  score: number;            // 0–100
  priority: PriorityLevel;
  confidence?: "high" | "medium" | "low";
  label?: string;
  /** Show compact inline version (score + badge only) */
  compact?: boolean;
  style?: React.CSSProperties;
}

const PRIORITY_CONFIG: Record<PriorityLevel, { label: string; color: string; bg: string; border: string; textLabel: string }> = {
  high:   { label: "HIGH",   color: "#991b1b", bg: "#fef2f2", border: "#fca5a5", textLabel: "สูง" },
  medium: { label: "MEDIUM", color: "#92400e", bg: "#fffbeb", border: "#fcd34d", textLabel: "กลาง" },
  low:    { label: "LOW",    color: "#166534", bg: "#f0fdf4", border: "#86efac", textLabel: "ต่ำ" },
};

const CONFIDENCE_LABELS: Record<string, string> = {
  high:   "สูง",
  medium: "กลาง",
  low:    "ต่ำ",
};

/**
 * Priority Score display component.
 * Never implies certainty — always shows confidence level.
 * Compact mode: inline badge only (for tables).
 * Full mode: score + priority + confidence + why-link.
 */
export function PriorityScore({
  score,
  priority,
  confidence = "medium",
  label = "ลำดับความสำคัญ",
  compact = false,
  style,
}: PriorityScoreProps) {
  const { color, bg, border, textLabel } = PRIORITY_CONFIG[priority];

  if (compact) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "3px 8px",
          backgroundColor: bg,
          border: `1px solid ${border}`,
          borderRadius: "var(--radius-full)",
          fontSize: "var(--fs-xs)",
          fontWeight: 700,
          color,
          ...style,
        }}
      >
        <span style={{ fontSize: "0.875rem", fontWeight: 800 }}>{score}</span>
        <span style={{ fontSize: "0.6875rem", opacity: 0.75 }}>{textLabel}</span>
      </span>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
        ...style,
      }}
    >
      {/* Label */}
      <div
        style={{
          fontSize: "var(--fs-xs)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--slate-500)",
        }}
      >
        {label}
      </div>

      {/* Priority badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--space-2)",
          padding: "var(--space-1) var(--space-3)",
          backgroundColor: bg,
          border: `1px solid ${border}`,
          borderRadius: "var(--radius-full)",
          width: "fit-content",
        }}
      >
        <span style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color }}>{PRIORITY_CONFIG[priority].label}</span>
      </div>

      {/* Big score number */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-1)" }}>
        <span
          style={{
            fontSize: "var(--fs-3xl)",
            fontWeight: 800,
            color: "var(--slate-900)",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {score}
        </span>
        <span style={{ fontSize: "var(--fs-sm)", color: "var(--slate-400)" }}>/ 100</span>
      </div>

      {/* Confidence — with tooltip explaining what it means */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", fontSize: "var(--fs-xs)", color: "var(--slate-500)" }}>
        <span>ความมั่นใจ:</span>
        <Tooltip content="ระดับความมั่นใจของโมเดล ML ในการประเมินลำดับ ขึ้นอยู่กับความสมบูรณ์ของข้อมูลลูกค้า">
          <span
            style={{ fontWeight: 700, color: "var(--slate-700)", cursor: "help", borderBottom: "1px dashed var(--slate-300)" }}
          >
            {CONFIDENCE_LABELS[confidence]}
          </span>
        </Tooltip>
      </div>
    </div>
  );
}
