"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@/types";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
  roles?: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "พื้นที่ทำงาน (Workspace)",
    items: [
      { label: "แดชบอร์ด (Dashboard)", href: "/dashboard", icon: "🏠" },
      { label: "รายชื่อลูกค้า (Customers)", href: "/customers", icon: "👥" },
      { label: "AI Copilot", href: "/chat", icon: "💬" },
    ],
  },
  {
    title: "ปฏิบัติการ (Operations)",
    items: [
      { label: "ภาพรวมธุรกิจ (Business View)", href: "/analytics", icon: "📈", roles: ["manager", "admin"] },
      { label: "สุขภาพระบบ AI (AI Health)", href: "/model", icon: "🤖", roles: ["manager", "admin"] },
      { label: "Pilot & Evaluation", href: "/pilot", icon: "🧪", badge: "Live", roles: ["manager", "admin"] },
    ],
  },
  {
    title: "การกำกับดูแล (Administration)",
    items: [
      { label: "บันทึกระบบ (System Audit)", href: "/admin/audit", icon: "📜", roles: ["admin"] },
    ],
  },
];

interface SidebarProps {
  user: User | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Called when a nav item is clicked — used by mobile overlay to close drawer */
  onMobileClose?: () => void;
}

export function Sidebar({ user, collapsed = false, onToggleCollapse, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const userRole = user?.role || "broker";

  return (
    <aside
      style={{
        width: collapsed ? "72px" : "260px",
        backgroundColor: "var(--bg-sidebar)",
        color: "var(--slate-300)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        transition: "width var(--transition-normal)",
        flexShrink: 0,
        zIndex: 50,
        borderRight: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: collapsed ? "16px 8px" : "20px 20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          minHeight: "68px",
        }}
      >
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "8px",
            backgroundColor: "var(--primary-600)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            color: "white",
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          ⚡
        </div>
        {!collapsed && (
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontWeight: 800, color: "white", fontSize: "0.95rem", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
              Broker Insight AI
            </div>
            <div style={{ fontSize: "0.6875rem", color: "var(--slate-400)", whiteSpace: "nowrap" }}>
              Krungsri Financial Advisory
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <div
        style={{
          flex: 1,
          padding: "16px 12px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {NAV_SECTIONS.map((section, idx) => {
          // Filter items based on user role
          const visibleItems = section.items.filter(
            (item) => !item.roles || item.roles.includes(userRole)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx}>
              {!collapsed && (
                <div
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "var(--slate-500)",
                    letterSpacing: "0.08em",
                    padding: "0 8px 8px 8px",
                  }}
                >
                  {section.title}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      onClick={onMobileClose}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: collapsed ? "10px" : "9px 12px",
                        justifyContent: collapsed ? "center" : "flex-start",
                        borderRadius: "var(--radius-md)",
                        fontSize: "0.84rem",
                        fontWeight: isActive ? 600 : 500,
                        backgroundColor: isActive ? "var(--primary-700)" : "transparent",
                        color: isActive ? "white" : "var(--slate-300)",
                        transition: "all var(--transition-fast)",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-sidebar-hover)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                      }}
                    >
                      <span style={{ fontSize: "16px", flexShrink: 0 }}>{item.icon}</span>
                      {!collapsed && (
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.label}
                        </span>
                      )}
                      {!collapsed && item.badge && (
                        <span
                          style={{
                            fontSize: "0.625rem",
                            fontWeight: 700,
                            padding: "1px 6px",
                            backgroundColor: "rgba(59, 130, 246, 0.25)",
                            color: "#93c5fd",
                            borderRadius: "var(--radius-full)",
                            border: "1px solid rgba(59, 130, 246, 0.4)",
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / User Profile & Collapse Toggle */}
      <div
        style={{
          padding: "12px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          gap: "8px",
        }}
      >
        {!collapsed && user && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "#1e3a8a",
                color: "#bfdbfe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.8rem",
                flexShrink: 0,
              }}
            >
              {user.full_name?.charAt(0) || "U"}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.full_name}
              </div>
              <div style={{ fontSize: "0.6875rem", color: "var(--slate-400)", textTransform: "capitalize" }}>
                {user.role}
              </div>
            </div>
          </div>
        )}

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title={collapsed ? "ขยายเมนู (Expand)" : "ย่อเมนู (Collapse)"}
            style={{
              padding: "6px",
              color: "var(--slate-400)",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-sidebar-hover)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
          >
            {collapsed ? "▶" : "◀"}
          </button>
        )}
      </div>
    </aside>
  );
}
