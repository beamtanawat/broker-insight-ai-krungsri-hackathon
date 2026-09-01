import React from "react";

export type CardVariant = "default" | "metric" | "insight" | "action";

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
  bordered?: boolean;
  elevated?: boolean;
  /** Semantic card variant — affects left-border treatment */
  variant?: CardVariant;
}

const VARIANT_LEFT_BORDER: Record<CardVariant, string> = {
  default: "none",
  metric:  "4px solid var(--primary-500)",
  insight: "4px solid var(--ai-accent)",
  action:  "4px solid var(--verified-accent)",
};

export function Card({
  title,
  subtitle,
  headerAction,
  footer,
  noPadding = false,
  bordered = true,
  elevated = false,
  variant = "default",
  children,
  className = "",
  style,
  ...rest
}: CardProps) {
  const borderLeft = VARIANT_LEFT_BORDER[variant];

  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        borderRadius: "var(--radius-lg)",
        border: bordered ? "1px solid var(--border-subtle)" : "none",
        borderLeft: borderLeft !== "none" ? borderLeft : (bordered ? "1px solid var(--border-subtle)" : "none"),
        boxShadow: elevated ? "var(--shadow-md)" : "var(--shadow-xs)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...style,
      }}
      className={className}
      {...rest}
    >
      {(title || headerAction) && (
        <div
          style={{
            padding: "var(--space-4) var(--space-5)",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--space-3)",
          }}
        >
          <div>
            {typeof title === "string" ? (
              <h3
                style={{
                  fontSize: "var(--fs-md)",
                  fontWeight: 600,
                  color: "var(--slate-900)",
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {title}
              </h3>
            ) : (
              title
            )}
            {subtitle && (
              <div
                style={{
                  fontSize: "var(--fs-xs)",
                  color: "var(--slate-500)",
                  marginTop: "2px",
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}

      <div style={{ padding: noPadding ? "0" : "var(--space-5)", flex: 1 }}>{children}</div>

      {footer && (
        <div
          style={{
            padding: "var(--space-3) var(--space-5)",
            backgroundColor: "var(--bg-surface-subtle)",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
