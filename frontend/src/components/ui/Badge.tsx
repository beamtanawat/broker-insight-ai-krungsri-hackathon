import React from "react";

export type BadgeVariant =
  | "high"
  | "medium"
  | "low"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "outline"
  | "ai";

export type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  high: {
    bg: "var(--priority-high-bg)",
    text: "var(--priority-high-text)",
    border: "var(--priority-high-border)",
  },
  medium: {
    bg: "var(--priority-med-bg)",
    text: "var(--priority-med-text)",
    border: "var(--priority-med-border)",
  },
  low: {
    bg: "var(--priority-low-bg)",
    text: "var(--priority-low-text)",
    border: "var(--priority-low-border)",
  },
  success: {
    bg: "var(--success-bg)",
    text: "var(--success-text)",
    border: "var(--success-border)",
  },
  warning: {
    bg: "var(--warning-bg)",
    text: "var(--warning-text)",
    border: "var(--warning-border)",
  },
  danger: {
    bg: "var(--danger-bg)",
    text: "var(--danger-text)",
    border: "var(--danger-border)",
  },
  info: {
    bg: "var(--info-bg)",
    text: "var(--info-text)",
    border: "var(--info-border)",
  },
  neutral: {
    bg: "var(--slate-100)",
    text: "var(--slate-700)",
    border: "var(--slate-200)",
  },
  outline: {
    bg: "transparent",
    text: "var(--slate-700)",
    border: "var(--slate-300)",
  },
  ai: {
    bg: "#eff6ff",
    text: "#1e40af",
    border: "#bfdbfe",
  },
};

const SIZE_STYLES: Record<BadgeSize, { padding: string; fontSize: string }> = {
  sm: { padding: "2px 6px", fontSize: "0.6875rem" },
  md: { padding: "3px 8px", fontSize: "0.75rem" },
  lg: { padding: "4px 12px", fontSize: "0.8125rem" },
};

export function Badge({
  variant = "neutral",
  size = "md",
  dot = false,
  children,
  style,
  ...rest
}: BadgeProps) {
  const { bg, text, border } = VARIANT_STYLES[variant] || VARIANT_STYLES.neutral;
  const { padding, fontSize } = SIZE_STYLES[size];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        backgroundColor: bg,
        color: text,
        border: `1px solid ${border}`,
        borderRadius: "var(--radius-full)",
        fontWeight: 600,
        lineHeight: 1.2,
        padding,
        fontSize,
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {dot && (
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: text,
          }}
        />
      )}
      {children}
    </span>
  );
}
