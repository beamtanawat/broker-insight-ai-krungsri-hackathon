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
      { label: "My Protection (ลูกค้า Gen Z)", href: "/my-protection", icon: "📱", badge: "Gen Z" },
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
          minHeight: "72px",
          background: "linear-gradient(180deg, rgba(254, 203, 0, 0.06) 0%, transparent 100%)",
        }}
      >
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            backgroundColor: "var(--krungsri-yellow)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            color: "#0b1e36",
            fontWeight: 900,
            flexShrink: 0,
            boxShadow: "0 0 14px rgba(254, 203, 0, 0.4)",
          }}
        >
          ⚡
        </div>
        {!collapsed && (
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontWeight: 800, color: "white", fontSize: "1.0rem", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
              Broker Insight <span style={{ color: "var(--krungsri-yellow)" }}>AI</span>
            </div>
            <div style={{ fontSize: "0.6875rem", color: "var(--slate-400)", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#22c55e", display: "inline-block", boxShadow: "0 0 6px #22c55e" }} />
              Krungsri Financial Advisory
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <div
        style={{
          flex: 1,
          padding: "18px 12px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "22px",
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
                    color: "var(--slate-400)",
                    letterSpacing: "0.09em",
                    padding: "0 10px 8px 10px",
                  }}
                >
                  {section.title}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
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
                        padding: collapsed ? "10px" : "10px 14px",
                        justifyContent: collapsed ? "center" : "flex-start",
                        borderRadius: "var(--radius-md)",
                        fontSize: "0.85rem",
                        fontWeight: isActive ? 700 : 500,
                        backgroundColor: isActive ? "rgba(254, 203, 0, 0.14)" : "transparent",
                        borderLeft: isActive ? "3px solid var(--krungsri-yellow)" : "3px solid transparent",
                        color: isActive ? "#ffffff" : "var(--slate-300)",
                        transition: "all var(--motion-fast)",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                          (e.currentTarget as HTMLElement).style.color = "#ffffff";
                          (e.currentTarget as HTMLElement).style.transform = "translateX(2px)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                          (e.currentTarget as HTMLElement).style.color = "var(--slate-300)";
                          (e.currentTarget as HTMLElement).style.transform = "none";
                        }
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
                            fontWeight: 800,
                            padding: "2px 7px",
                            backgroundColor: "rgba(254, 203, 0, 0.2)",
                            color: "var(--krungsri-yellow)",
                            borderRadius: "var(--radius-full)",
                            border: "1px solid rgba(254, 203, 0, 0.4)",
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
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                backgroundColor: "#0f2744",
                border: "2px solid var(--krungsri-yellow)",
                color: "var(--krungsri-yellow)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "0.85rem",
                flexShrink: 0,
                boxShadow: "0 0 10px rgba(254, 203, 0, 0.25)",
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
