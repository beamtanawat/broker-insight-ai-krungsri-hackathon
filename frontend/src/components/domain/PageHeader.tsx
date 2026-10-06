import React from "react";
import { Breadcrumb } from "../navigation/Breadcrumb";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  badge?: React.ReactNode;
}

/**
 * Consistent page-level header.
 * Used by every page in the app for visual consistency.
 *
 * Layout:
 *   [Breadcrumb?]
 *   [Title]  [badge?]          [secondary action] [primary action]
 *   [description?]
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  primaryAction,
  secondaryAction,
  badge,
}: PageHeaderProps) {
  return (
    <div style={{ marginBottom: "var(--space-6)" }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div style={{ marginBottom: "var(--space-2)" }}>
          <Breadcrumb items={breadcrumbs} />
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "var(--space-4)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "var(--fs-xl)",
                fontWeight: 700,
                color: "var(--slate-900)",
                lineHeight: 1.25,
              }}
            >
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p
              style={{
                margin: "var(--space-1) 0 0 0",
                fontSize: "var(--fs-sm)",
                color: "var(--slate-500)",
                lineHeight: 1.5,
              }}
            >
              {description}
            </p>
          )}
        </div>

        {(primaryAction || secondaryAction) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              flexShrink: 0,
            }}
          >
            {secondaryAction}
            {primaryAction}
          </div>
        )}
      </div>
    </div>
  );
}
