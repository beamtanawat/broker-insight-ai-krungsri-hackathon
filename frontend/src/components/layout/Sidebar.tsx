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
    title: "",
    items: [
      { label: "แดชบอร์ด", href: "/dashboard", icon: "🏠" },
      { label: "รายชื่อลูกค้า", href: "/customers", icon: "👥" },
      { label: "แผนที่ลูกค้าใกล้เคียง", href: "/visit-planner", icon: "📍" },
      { label: "รายงาน", href: "/analytics", icon: "📊" },
      { label: "ตั้งค่า", href: "/admin/audit", icon: "⚙️" },
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
        background: "linear-gradient(180deg, #5a4544 0%, #3e2e2d 100%)",
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
          padding: collapsed ? "16px 8px" : "16px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          minHeight: "72px",
          background: "linear-gradient(180deg, rgba(254, 203, 0, 0.06) 0%, transparent 100%)",
        }}
      >
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            width: "100%",
            justifyContent: collapsed ? "center" : "flex-start",
          }}
          title="Broker Insight AI"
        >
          {collapsed ? (
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                backgroundColor: "#001c35",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.12)",
                overflow: "hidden",
              }}
            >
              <img
                src="/broker-insight-icon.png"
                alt="Broker Insight AI"
                style={{
                  width: "32px",
                  height: "auto",
                  display: "block",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                width: "100%",
              }}
            >
              <div
                style={{
                  padding: "6px 10px",
                  borderRadius: "10px",
                  backgroundColor: "#001c35",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  width: "fit-content",
                }}
              >
                <img
                  src="/broker-insight-logo.png"
                  alt="Broker Insight AI"
                  style={{
                    height: "34px",
                    width: "auto",
                    display: "block",
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--slate-400)",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  paddingLeft: "4px",
                  marginTop: "2px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "#22c55e",
                    display: "inline-block",
                    boxShadow: "0 0 6px #22c55e",
                  }}
                />
                Krungsri Financial Advisory
              </div>
            </div>
          )}
        </Link>
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
                    fontSize: "0.875rem",
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
                        fontSize: "0.875rem",
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
                            fontSize: "0.75rem",
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

      {/* AI Assistant Promo Banner Card matching screenshot */}
      {!collapsed && (
        <div
          style={{
            margin: "0 12px 14px 12px",
            padding: "18px 14px",
            borderRadius: "14px",
            background: "linear-gradient(145deg, rgba(58, 44, 43, 0.95) 0%, rgba(41, 31, 30, 0.98) 100%)",
            border: "1px solid rgba(254, 203, 0, 0.35)",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.25)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "1.85rem",
              marginBottom: "6px",
              filter: "drop-shadow(0 0 8px rgba(254, 203, 0, 0.6))",
            }}
          >
            🧠
          </div>
          <div style={{ fontSize: "0.875rem", fontWeight: 800, color: "#FFFFFF", marginBottom: "3px" }}>
            AI เคียงข้าง
          </div>
          <div style={{ fontSize: "0.75rem", color: "#CBD5E1", marginBottom: "6px", fontWeight: 500 }}>
            ทุกโอกาสการดูแลลูกค้า
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>
            Empower Your Advisory Journey
          </div>
        </div>
      )}

      {/* Footer / Collapse Toggle */}
      <div
        style={{
          padding: "8px 12px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-end",
        }}
      >
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title={collapsed ? "ขยายเมนู (Expand)" : "ย่อเมนู (Collapse)"}
            style={{
              padding: "4px 8px",
              color: "#94A3B8",
              backgroundColor: "transparent",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#ffffff")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#94A3B8")}
          >
            {collapsed ? "»" : "«"}
          </button>
        )}
      </div>
    </aside>
  );
}
