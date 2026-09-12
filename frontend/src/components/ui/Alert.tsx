import React from "react";

export type AlertVariant = "info" | "success" | "warning" | "danger";

interface AlertProps {
  variant?: AlertVariant;
  title?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
  style?: React.CSSProperties;
}

const ALERT_STYLES: Record<AlertVariant, { bg: string; border: string; text: string; titleColor: string; defaultIcon: string }> = {
  info: {
    bg: "var(--info-bg)",
    border: "var(--info-border)",
    text: "var(--info-text)",
    titleColor: "#4a3837",
    defaultIcon: "ℹ️",
  },
  success: {
    bg: "var(--success-bg)",
    border: "var(--success-border)",
    text: "var(--success-text)",
    titleColor: "#166534",
    defaultIcon: "✅",
  },
  warning: {
    bg: "var(--warning-bg)",
    border: "var(--warning-border)",
    text: "var(--warning-text)",
    titleColor: "#92400e",
    defaultIcon: "⚠️",
  },
  danger: {
    bg: "var(--danger-bg)",
    border: "var(--danger-border)",
    text: "var(--danger-text)",
    titleColor: "#991b1b",
    defaultIcon: "❌",
  },
};

export function Alert({
  variant = "info",
  title,
  children,
  action,
  icon,
  onClose,
  style,
}: AlertProps) {
  const { bg, border, text, titleColor, defaultIcon } = ALERT_STYLES[variant] || ALERT_STYLES.info;

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        padding: "14px 16px",
        backgroundColor: bg,
        border: `1px solid ${border}`,
        borderRadius: "var(--radius-md)",
        color: text,
        fontSize: "var(--fs-base)",
        lineHeight: 1.5,
        ...style,
      }}
    >
      <span style={{ fontSize: "16px", flexShrink: 0, marginTop: title ? "2px" : "0" }}>
        {icon || defaultIcon}
      </span>
      <div style={{ flex: 1 }}>
        {title && (
          <div style={{ fontWeight: 700, color: titleColor, marginBottom: "4px" }}>
            {title}
          </div>
        )}
        <div>{children}</div>
      </div>
      {(action || onClose) && (
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          {action}
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                color: text,
                cursor: "pointer",
                padding: "2px 6px",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.875rem",
                opacity: 0.75,
                fontWeight: "bold",
              }}
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}
