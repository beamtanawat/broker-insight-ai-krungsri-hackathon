import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

export function EmptyState({
  icon = "📂",
  title,
  description,
  action,
  style,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        color: "var(--slate-500)",
        ...style,
      }}
    >
      <div style={{ fontSize: "36px", marginBottom: "12px", opacity: 0.8 }}>
        {icon}
      </div>
      <h4
        style={{
          margin: "0 0 6px 0",
          fontSize: "var(--fs-md)",
          fontWeight: 600,
          color: "var(--slate-700)",
        }}
      >
        {title}
      </h4>
      {description && (
        <p
          style={{
            margin: "0 0 16px 0",
            fontSize: "var(--fs-sm)",
            maxWidth: "360px",
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
