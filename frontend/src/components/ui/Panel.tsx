import React from "react";

export type PanelVariant = "ai" | "verified" | "broker" | "rule" | "default";

interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: PanelVariant;
  title?: React.ReactNode;
  /** Short label shown in upper-left (e.g. "AI Insight", "Verified Data") */
  label?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

const VARIANT_MAP: Record<PanelVariant, { bg: string; border: string; labelColor: string; borderLeft: string }> = {
  ai: {
    bg: "var(--ai-bg)",
    border: "var(--ai-border)",
    labelColor: "var(--ai-text)",
    borderLeft: "3px solid var(--ai-accent)",
  },
  verified: {
    bg: "var(--verified-bg)",
    border: "var(--verified-border)",
    labelColor: "var(--verified-text)",
    borderLeft: "3px solid var(--verified-accent)",
  },
  broker: {
    bg: "var(--broker-bg)",
    border: "var(--broker-border)",
    labelColor: "var(--broker-text)",
    borderLeft: "3px solid var(--broker-accent)",
  },
  rule: {
    bg: "var(--rule-bg)",
    border: "var(--rule-border)",
    labelColor: "var(--rule-text)",
    borderLeft: "3px solid var(--rule-accent)",
  },
  default: {
    bg: "var(--bg-surface)",
    border: "var(--border-subtle)",
    labelColor: "var(--slate-600)",
    borderLeft: "3px solid var(--slate-300)",
  },
};

const VARIANT_ICON: Record<PanelVariant, string> = {
  ai:       "⚡",
  verified: "✓",
  broker:   "👤",
  rule:     "⚙",
  default:  "📋",
};

/**
 * Structured content panel with AI/Verified/Broker/Rule visual distinction.
 * The primary vehicle for ensuring users never confuse AI output with real data.
 */
export function Panel({
  variant = "default",
  title,
  label,
  action,
  children,
  style,
  ...rest
}: PanelProps) {
  const { bg, border, labelColor, borderLeft } = VARIANT_MAP[variant];
  const icon = VARIANT_ICON[variant];

  return (
    <div
      style={{
        backgroundColor: bg,
        border: `1px solid ${border}`,
        borderLeft,
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        ...style,
      }}
      {...rest}
    >
      {(label || title || action) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "var(--space-3) var(--space-4)",
            borderBottom: `1px solid ${border}`,
          }}
        >
          <div>
            {label && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "var(--fs-xs)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: labelColor,
                  marginBottom: title ? "4px" : 0,
                }}
              >
                <span aria-hidden="true">{icon}</span>
                <span>{label}</span>
              </div>
            )}
            {title && (
              <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--slate-800)" }}>
                {title}
              </div>
            )}
          </div>
          {action && <div style={{ flexShrink: 0 }}>{action}</div>}
        </div>
      )}
      <div style={{ padding: "var(--space-4)" }}>{children}</div>
    </div>
  );
}
