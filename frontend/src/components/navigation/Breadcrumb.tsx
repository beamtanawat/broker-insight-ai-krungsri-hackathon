import React from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumb navigation — shows hierarchical page location.
 * Example: Dashboard → Customers → สมศรี ใจดี
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          listStyle: "none",
          margin: 0,
          padding: 0,
          fontSize: "var(--fs-xs)",
          color: "var(--slate-500)",
        }}
      >
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li
              key={idx}
              style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}
              aria-current={isLast ? "page" : undefined}
            >
              {idx > 0 && (
                <span aria-hidden="true" style={{ color: "var(--slate-300)", fontSize: "12px" }}>
                  ›
                </span>
              )}
              {isLast || !item.href ? (
                <span
                  style={{
                    fontWeight: isLast ? 600 : 400,
                    color: isLast ? "var(--slate-700)" : "var(--slate-500)",
                  }}
                >
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  style={{
                    color: "var(--slate-500)",
                    textDecoration: "none",
                    transition: "color var(--motion-fast)",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--primary-700)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--slate-500)")}
                >
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
