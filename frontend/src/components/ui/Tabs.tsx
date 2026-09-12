import React, { useRef } from "react";

export interface TabItem {
  id: string;
  label: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: "underline" | "pills";
}

/**
 * Enhanced Tabs with:
 * - ARIA roles (tablist / tab / tabpanel)
 * - ArrowLeft / ArrowRight keyboard navigation
 * - Disabled tab support
 */
export function Tabs({ tabs, activeTab, onChange, variant = "underline" }: TabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(e: React.KeyboardEvent, idx: number) {
    const enabledTabs = tabs.map((t, i) => ({ ...t, idx: i })).filter((t) => !t.disabled);
    const currentPos = enabledTabs.findIndex((t) => t.idx === idx);

    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = enabledTabs[(currentPos + 1) % enabledTabs.length];
      tabRefs.current[next.idx]?.focus();
      onChange(next.id);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = enabledTabs[(currentPos - 1 + enabledTabs.length) % enabledTabs.length];
      tabRefs.current[prev.idx]?.focus();
      onChange(prev.id);
    } else if (e.key === "Home") {
      e.preventDefault();
      const first = enabledTabs[0];
      tabRefs.current[first.idx]?.focus();
      onChange(first.id);
    } else if (e.key === "End") {
      e.preventDefault();
      const last = enabledTabs[enabledTabs.length - 1];
      tabRefs.current[last.idx]?.focus();
      onChange(last.id);
    }
  }

  if (variant === "pills") {
    return (
      <div
        role="tablist"
        style={{
          display: "flex",
          gap: "var(--space-2)",
          backgroundColor: "var(--slate-100)",
          padding: "4px",
          borderRadius: "var(--radius-md)",
          width: "fit-content",
        }}
      >
        {tabs.map((t, idx) => {
          const isActive = t.id === activeTab;
          return (
            <button
              key={t.id}
              ref={(el) => { tabRefs.current[idx] = el; }}
              role="tab"
              aria-selected={isActive}
              aria-disabled={t.disabled}
              tabIndex={isActive ? 0 : -1}
              disabled={t.disabled}
              onClick={() => !t.disabled && onChange(t.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                fontSize: "var(--fs-sm)",
                fontWeight: isActive ? 600 : 500,
                borderRadius: "var(--radius-sm)",
                backgroundColor: isActive ? "var(--white)" : "transparent",
                color: t.disabled
                  ? "var(--slate-300)"
                  : isActive
                  ? "var(--slate-900)"
                  : "var(--slate-600)",
                boxShadow: isActive ? "var(--shadow-xs)" : "none",
                transition: "all var(--motion-fast)",
                cursor: t.disabled ? "not-allowed" : "pointer",
                opacity: t.disabled ? 0.5 : 1,
              }}
            >
              {t.icon}
              {t.label}
              {t.badge}
            </button>
          );
        })}
      </div>
    );
  }

  // Default: underline variant
  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        gap: "var(--space-6)",
        borderBottom: "1px solid var(--border-subtle)",
        overflowX: "auto",
      }}
    >
      {tabs.map((t, idx) => {
        const isActive = t.id === activeTab;
        return (
          <button
            key={t.id}
            ref={(el) => { tabRefs.current[idx] = el; }}
            role="tab"
            aria-selected={isActive}
            aria-disabled={t.disabled}
            tabIndex={isActive ? 0 : -1}
            disabled={t.disabled}
            onClick={() => !t.disabled && onChange(t.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-2)",
              padding: "var(--space-3) 8px",
              fontSize: "var(--fs-base)",
              fontWeight: isActive ? 700 : 500,
              color: t.disabled
                ? "var(--slate-300)"
                : isActive
                ? "#4a3837"
                : "var(--slate-600)",
              borderBottom: `3px solid ${isActive ? "var(--krungsri-yellow)" : "transparent"}`,
              backgroundColor: isActive ? "rgba(254, 203, 0, 0.08)" : "transparent",
              borderRadius: "var(--radius-sm) var(--radius-sm) 0 0",
              marginBottom: "-1px",
              whiteSpace: "nowrap",
              transition: "all var(--motion-fast)",
              cursor: t.disabled ? "not-allowed" : "pointer",
              opacity: t.disabled ? 0.5 : 1,
            }}
          >
            {t.icon}
            {t.label}
            {t.badge}
          </button>
        );
      })}
    </div>
  );
}
