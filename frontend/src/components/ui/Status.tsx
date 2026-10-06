import React from "react";

export type StatusVariant = "healthy" | "warning" | "critical" | "pending" | "inactive";

interface StatusProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: StatusVariant;
  /** Override the default label for this status. */
  label?: string;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<StatusVariant, { color: string; icon: string; defaultLabel: string; bg: string }> = {
  healthy:  { color: "#16a34a", bg: "#dcfce7", icon: "●", defaultLabel: "Healthy" },
  warning:  { color: "#d97706", bg: "#fef3c7", icon: "▲", defaultLabel: "Warning" },
  critical: { color: "#dc2626", bg: "#fee2e2", icon: "✕", defaultLabel: "Critical" },
  pending:  { color: "#64748b", bg: "#f1f5f9", icon: "◌", defaultLabel: "Pending" },
  inactive: { color: "#94a3b8", bg: "#f8fafc", icon: "○", defaultLabel: "Inactive" },
};

/**
 * Status indicator — always uses icon + text, never color alone.
 * Meets WCAG 1.4.1: information is not conveyed by color only.
 */
export function Status({ variant, label, size = "md", style, ...rest }: StatusProps) {
  const { color, bg, icon, defaultLabel } = STATUS_CONFIG[variant];
  const displayLabel = label ?? defaultLabel;
  const fontSize = size === "sm" ? "var(--fs-xs)" : "var(--fs-sm)";
  const iconSize = size === "sm" ? "8px" : "9px";

  return (
    <span
      role="status"
      aria-label={displayLabel}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: size === "sm" ? "2px 8px" : "4px 10px",
        backgroundColor: bg,
        color,
        borderRadius: "var(--radius-full)",
        fontSize,
        fontWeight: 600,
        lineHeight: 1.2,
        ...style,
      }}
      {...rest}
    >
      <span
        aria-hidden="true"
        style={{ fontSize: iconSize, lineHeight: 1, flexShrink: 0 }}
      >
        {icon}
      </span>
      <span>{displayLabel}</span>
    </span>
  );
}
