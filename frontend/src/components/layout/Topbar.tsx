"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearTokens } from "@/lib/auth";
import type { User } from "@/types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface TopbarProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  user: User | null;
  actions?: React.ReactNode;
  /** Defined only on mobile — shows hamburger button */
  onMobileMenuToggle?: () => void;
}

const ROLE_BADGE: Record<string, { variant: "danger" | "warning" | "info"; label: string }> = {
  admin:   { variant: "danger",  label: "Admin" },
  manager: { variant: "warning", label: "Manager" },
  broker:  { variant: "info",    label: "Broker" },
};

export function Topbar({ title, subtitle, user, actions, onMobileMenuToggle }: TopbarProps) {
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  function handleLogout() {
    clearTokens();
    router.push("/login");
  }

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userMenuOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setUserMenuOpen(false);
    }
    if (userMenuOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [userMenuOpen]);

  const roleConfig = user ? (ROLE_BADGE[user.role] ?? ROLE_BADGE.broker) : null;

  return (
    <header
      style={{
        height: "64px",
        backgroundColor: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 var(--space-6)",
        position: "sticky",
        top: 0,
        zIndex: 40,
        gap: "var(--space-4)",
      }}
    >
      {/* Left: hamburger (mobile) + title */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", minWidth: 0, flex: 1 }}>
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            aria-label="เปิด/ปิดเมนูนำทาง"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "var(--radius-md)",
              color: "var(--slate-600)",
              flexShrink: 0,
              fontSize: "18px",
            }}
          >
            ☰
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontSize: "var(--fs-md)",
              fontWeight: 700,
              color: "var(--slate-900)",
              margin: 0,
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title || "Broker Insight AI"}
          </h1>
          {subtitle && (
            <div
              style={{
                fontSize: "var(--fs-xs)",
                color: "var(--slate-500)",
                marginTop: "1px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Right: Pilot badge + page actions + user menu */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>

        {/* Pilot Sandbox indicator */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "3px 10px",
            borderRadius: "var(--radius-full)",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            fontSize: "0.6875rem",
            fontWeight: 600,
            color: "#166534",
          }}
          title="ระบบทำงานในโหมดทดสอบนำร่อง (Pilot Sandbox) — ใช้ชุดข้อมูลจำลองที่ปลอดภัย"
        >
          <span
            aria-hidden="true"
            style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#16a34a", display: "inline-block" }}
          />
          <span className="sr-only">สถานะ: </span>
          <span>Pilot Sandbox</span>
        </div>

        {/* Page-level actions */}
        {actions && <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>{actions}</div>}

        {/* User menu */}
        {user && (
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              aria-label={`เมนูผู้ใช้ — ${user.full_name}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                padding: "var(--space-1) var(--space-2)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                backgroundColor: "var(--white)",
                cursor: "pointer",
                transition: "all var(--motion-fast)",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--slate-50)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--white)")}
            >
              {/* Avatar */}
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: "var(--primary-100)",
                  color: "var(--primary-700)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "var(--fs-xs)",
                  flexShrink: 0,
                }}
              >
                {user.full_name?.charAt(0) ?? "U"}
              </div>
              {/* Name — hidden on narrow viewports via CSS would be ideal; inline hidden on xs */}
              <span style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--slate-700)", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.full_name}
              </span>
              <span aria-hidden="true" style={{ fontSize: "10px", color: "var(--slate-400)" }}>
                {userMenuOpen ? "▲" : "▼"}
              </span>
            </button>

            {/* Dropdown menu */}
            {userMenuOpen && (
              <div
                role="menu"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  minWidth: "220px",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "var(--shadow-md)",
                  zIndex: 50,
                  overflow: "hidden",
                  animation: "tooltipPop var(--motion-fast) ease forwards",
                }}
              >
                {/* User info header */}
                <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontWeight: 700, fontSize: "var(--fs-sm)", color: "var(--slate-900)" }}>
                    {user.full_name}
                  </div>
                  <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "2px", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    {roleConfig && (
                      <Badge variant={roleConfig.variant} size="sm">{roleConfig.label}</Badge>
                    )}
                    <span>Pilot Sandbox</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ padding: "var(--space-2)" }}>
                  <button
                    role="menuitem"
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      padding: "var(--space-2) var(--space-3)",
                      borderRadius: "var(--radius-md)",
                      fontSize: "var(--fs-sm)",
                      color: "var(--danger-text)",
                      fontWeight: 500,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background-color var(--motion-fast)",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--danger-bg)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
                  >
                    <span aria-hidden="true">↩</span>
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
