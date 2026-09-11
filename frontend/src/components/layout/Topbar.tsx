"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearTokens } from "@/lib/auth";
import type { User } from "@/types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { CommandPalette } from "./CommandPalette";

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
  const [notifOpen, setNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  function handleLogout() {
    clearTokens();
    router.push("/login");
  }

  // Close menus on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on Escape & Global Cmd+K trigger
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setUserMenuOpen(false);
        setNotifOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const roleConfig = user ? (ROLE_BADGE[user.role] ?? ROLE_BADGE.broker) : null;

  return (
    <header
      style={{
        height: "64px",
        backgroundColor: "rgba(255, 255, 255, 0.88)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
        boxShadow: "0 1px 4px 0 rgba(11, 30, 54, 0.03)",
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
              fontWeight: 800,
              color: "#0b1e36",
              margin: 0,
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              letterSpacing: "-0.01em",
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

      {/* Right: AI engine status + Pilot badge + page actions + user menu */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>

        {/* Quick Command Palette Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "5px 12px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "rgba(11, 30, 54, 0.04)",
            border: "1px solid rgba(11, 30, 54, 0.1)",
            fontSize: "12px",
            color: "var(--slate-600)",
            cursor: "pointer",
            transition: "all var(--motion-fast) ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(11, 30, 54, 0.08)";
            e.currentTarget.style.borderColor = "var(--krungsri-yellow)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(11, 30, 54, 0.04)";
            e.currentTarget.style.borderColor = "rgba(11, 30, 54, 0.1)";
          }}
          title="ค้นหาลูกค้าหรือเมนู (Cmd+K)"
        >
          <span>🔍</span>
          <span style={{ fontWeight: 600 }}>ค้นหาด่วน...</span>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              backgroundColor: "#ffffff",
              padding: "2px 5px",
              borderRadius: "4px",
              border: "1px solid var(--border-subtle)",
              color: "var(--slate-500)",
            }}
          >
            ⌘K
          </span>
        </button>

        {/* Customer View Quick Switch (Gen Z My Protection) */}
        <Link
          href="/my-protection"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 12px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            color: "#1d4ed8",
            fontSize: "12px",
            fontWeight: 700,
            textDecoration: "none",
            transition: "all var(--motion-fast) ease",
          }}
          title="สลับไปดูมุมมองลูกค้า Gen Z (Customer-Facing Prototype)"
        >
          <span>📱</span>
          <span>มุมมองลูกค้า (My Protection)</span>
          <span
            style={{
              fontSize: "10px",
              background: "#dbeafe",
              color: "#1e40af",
              padding: "1px 5px",
              borderRadius: "999px",
            }}
          >
            Gen Z
          </span>
        </Link>

        {/* AI Engine Status Pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "3px 10px",
            borderRadius: "var(--radius-full)",
            backgroundColor: "rgba(254, 203, 0, 0.14)",
            border: "1px solid rgba(254, 203, 0, 0.45)",
            fontSize: "0.6875rem",
            fontWeight: 700,
            color: "#854d0e",
          }}
          title="LightGBM & SHAP Explainability Engine พร้อมประมวลผล"
        >
          <span style={{ fontSize: "11px" }}>⚡</span>
          <span>AI Engine Active</span>
        </div>

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
            style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#16a34a", display: "inline-block", boxShadow: "0 0 5px #16a34a" }}
          />
          <span>Sandbox</span>
        </div>

        {/* Notification Bell with Dropdown */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label="การแจ้งเตือนด่วน"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              backgroundColor: notifOpen ? "var(--slate-100)" : "var(--white)",
              cursor: "pointer",
              position: "relative",
              fontSize: "16px",
              transition: "all var(--motion-fast) ease",
            }}
          >
            🔔
            {/* Red Alert Dot / Badge */}
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                backgroundColor: "#dc2626",
                color: "#ffffff",
                fontSize: "10px",
                fontWeight: 800,
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 3px rgba(220, 38, 38, 0.4)",
              }}
            >
              2
            </span>
          </button>

          {/* Notifications Dropdown */}
          {notifOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: "320px",
                backgroundColor: "#ffffff",
                borderRadius: "var(--radius-xl)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "0 10px 25px -5px rgba(11, 30, 54, 0.15), 0 8px 10px -6px rgba(11, 30, 54, 0.1)",
                zIndex: 60,
                overflow: "hidden",
                animation: "tooltipPop var(--motion-fast) ease forwards",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  background: "var(--krungsri-navy-gradient)",
                  color: "#ffffff",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: "13px" }}>
                  🔔 การแจ้งเตือนด่วน (2 รายการ)
                </div>
                <span style={{ fontSize: "10px", color: "var(--krungsri-yellow)", fontWeight: 700 }}>
                  Real-time
                </span>
              </div>

              <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {/* Notif 1 */}
                <Link
                  href="/customers/d82e838c-63fb-47a3-9428-f15dc4d68883"
                  onClick={() => setNotifOpen(false)}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: "var(--radius-lg)",
                      backgroundColor: "#fef2f2",
                      border: "1px solid #fee2e2",
                      cursor: "pointer",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fee2e2")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fef2f2")}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#991b1b" }}>
                        ⚡ ต่ออายุด่วนใน 14 วัน
                      </span>
                      <span style={{ fontSize: "10px", color: "#b91c1c", fontWeight: 600 }}>KS-00001</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#7f1d1d", marginTop: "2px" }}>
                      คุณณัฐพร วาริน (Platinum) กรมธรรม์ใกล้ครบกำหนด
                    </div>
                  </div>
                </Link>

                {/* Notif 2 */}
                <Link
                  href="/customers?priority=high"
                  onClick={() => setNotifOpen(false)}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: "var(--radius-lg)",
                      backgroundColor: "#fffbeb",
                      border: "1px solid #fef3c7",
                      cursor: "pointer",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fef3c7")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fffbeb")}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#92400e" }}>
                        ⚠️ งานติดตามผลเกินกำหนด
                      </span>
                      <span style={{ fontSize: "10px", color: "#b45309", fontWeight: 600 }}>1 งาน</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#78350f", marginTop: "2px" }}>
                      มีนัดหมายค้างที่ต้องติดต่อด่วนเพื่ออัปเดตผลงาน
                    </div>
                  </div>
                </Link>
              </div>

              <div
                style={{
                  padding: "8px 16px",
                  backgroundColor: "var(--slate-50)",
                  borderTop: "1px solid var(--border-subtle)",
                  textAlign: "center",
                }}
              >
                <Link
                  href="/customers"
                  onClick={() => setNotifOpen(false)}
                  style={{ fontSize: "11px", color: "var(--krungsri-navy)", fontWeight: 700, textDecoration: "none" }}
                >
                  ดูรายชื่อลูกค้าทั้งหมด →
                </Link>
              </div>
            </div>
          )}
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

      {/* Global Command Palette */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}
