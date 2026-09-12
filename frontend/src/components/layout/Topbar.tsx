"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearTokens, setTokens } from "@/lib/auth";
import { api } from "@/lib/api";
import type { User } from "@/types";
import { Badge } from "../ui/Badge";
import { CommandPalette } from "./CommandPalette";
import { useOnboardingTour } from "@/context/OnboardingTourContext";

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
  const { replayTour, openWelcomeModal } = useOnboardingTour();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const [switchingRole, setSwitchingRole] = useState(false);

  async function handleSwitchRole(targetEmail: string) {
    setSwitchingRole(true);
    try {
      const tokens = await api.auth.login(targetEmail, "demo1234");
      setTokens(tokens.access_token, tokens.refresh_token);
      try {
        sessionStorage.setItem("trigger_welcome_onboarding", "true");
        localStorage.removeItem("broker-insight-onboarding-completed");
        localStorage.removeItem("broker-insight-onboarding-dismissed");
      } catch {}
      setUserMenuOpen(false);
      window.location.reload();
    } catch (err) {
      console.error("Failed to switch role:", err);
      setSwitchingRole(false);
    }
  }

  function handleLogout() {
    clearTokens();
    try {
      sessionStorage.setItem("trigger_welcome_onboarding", "true");
      localStorage.removeItem("broker-insight-onboarding-completed");
      localStorage.removeItem("broker-insight-onboarding-dismissed");
    } catch {}
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

        {/* Center: Search Bar matching mockup */}
        <div
          onClick={() => setIsSearchOpen(true)}
          style={{
            flex: "1 1 360px",
            maxWidth: "460px",
            backgroundColor: "#F8FAFC",
            borderRadius: "999px",
            padding: "7px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
            border: "1px solid #E2E8F0",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#F1F5F9";
            e.currentTarget.style.borderColor = "#CBD5E1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#F8FAFC";
            e.currentTarget.style.borderColor = "#E2E8F0";
          }}
          title="ค้นหาลูกค้า, รหัสลูกค้า, เบอร์โทร, กรมธรรม์... (Cmd+K)"
        >
          <span style={{ fontSize: "14px", color: "#64748B" }}>🔍</span>
          <span style={{ fontSize: "0.8125rem", color: "#64748B", fontWeight: 500, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            ค้นหาลูกค้า, รหัสลูกค้า, เบอร์โทร, กรมธรรม์...
          </span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              backgroundColor: "#ffffff",
              padding: "2px 6px",
              borderRadius: "4px",
              border: "1px solid #E2E8F0",
              color: "#94A3B8",
            }}
          >
            Ctrl K
          </span>
        </div>

        {/* AI Engine Status Pill (Green) */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 12px",
            borderRadius: "999px",
            backgroundColor: "#DCFCE7",
            border: "1px solid #BBF7D0",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#15803D",
          }}
          title="LightGBM & AI Customer Intelligence Engine พร้อมใช้งาน"
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: "#16A34A",
              display: "inline-block",
              boxShadow: "0 0 6px #16A34A",
            }}
          />
          <span>AI Engine Active</span>
        </div>

        {/* Pilot Sandbox indicator (Amber) */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 12px",
            borderRadius: "999px",
            backgroundColor: "#FEF3C7",
            border: "1px solid #FDE68A",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#B45309",
          }}
          title="ระบบทำงานในโหมดทดสอบนำร่อง (Pilot Sandbox)"
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: "#F59E0B",
              display: "inline-block",
            }}
          />
          <span>Sandbox</span>
        </div>

        {/* Help / Guided Tour button */}
        <button
          onClick={() => openWelcomeModal()}
          data-tour="topbar-help"
          aria-label="แนะนำฟีเจอร์ระบบ (Feature Tour)"
          title="แนะนำฟีเจอร์ทั้งหมดของระบบ (เปิดคู่มือแนะนำทีละฟีเจอร์)"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 12px",
            borderRadius: "999px",
            border: "1px solid #FEF08A",
            backgroundColor: "#FEFCE8",
            cursor: "pointer",
            fontSize: "0.8125rem",
            fontWeight: 700,
            color: "#854D0E",
            transition: "all var(--motion-fast) ease",
            boxShadow: "0 1px 3px rgba(180, 83, 9, 0.08)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#FEF08A";
            e.currentTarget.style.borderColor = "#FDE047";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#FEFCE8";
            e.currentTarget.style.borderColor = "#FEF08A";
            e.currentTarget.style.transform = "none";
          }}
        >
          <span style={{ fontSize: "14px" }} aria-hidden="true">✨</span>
          <span>แนะนำฟีเจอร์</span>
        </button>

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
              borderRadius: "50%",
              border: "1px solid #E2E8F0",
              backgroundColor: notifOpen ? "#F1F5F9" : "#ffffff",
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
                top: "-3px",
                right: "-3px",
                backgroundColor: "#DC2626",
                color: "#ffffff",
                fontSize: "12px",
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
              3
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
                <div style={{ fontWeight: 800, fontSize: "14px" }}>
                  🔔 การแจ้งเตือนด่วน (2 รายการ)
                </div>
                <span style={{ fontSize: "12px", color: "var(--krungsri-yellow)", fontWeight: 700 }}>
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
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#991b1b" }}>
                        ⚡ ต่ออายุด่วนใน 14 วัน
                      </span>
                      <span style={{ fontSize: "12px", color: "#b91c1c", fontWeight: 600 }}>KS-00001</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#7f1d1d", marginTop: "2px" }}>
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
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#92400e" }}>
                        ⚠️ งานติดตามผลเกินกำหนด
                      </span>
                      <span style={{ fontSize: "12px", color: "#b45309", fontWeight: 600 }}>1 งาน</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#78350f", marginTop: "2px" }}>
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
                  style={{ fontSize: "12px", color: "var(--krungsri-navy)", fontWeight: 700, textDecoration: "none" }}
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
                gap: "10px",
                padding: "4px 8px",
                borderRadius: "999px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#ffffff",
                cursor: "pointer",
                transition: "all var(--motion-fast)",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#F8FAFC")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#ffffff")}
            >
              {/* Avatar Image */}
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundImage: "url('/images/somchai_avatar.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center top",
                  border: "1px solid #CBD5E1",
                  flexShrink: 0,
                }}
              />
              {/* Name & Title */}
              <div style={{ textAlign: "left", lineHeight: 1.2 }}>
                <div
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    color: "#0F172A",
                    maxWidth: "140px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.full_name || "สมชาย มุ่งมั่น"}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748B",
                    fontWeight: 500,
                  }}
                >
                  {user.role === "broker" ? "Broker • KS-10001" : user.role}
                </div>
              </div>
              <span aria-hidden="true" style={{ fontSize: "12px", color: "#94A3B8", marginLeft: "2px" }}>
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
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--slate-900)" }}>
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
                <div style={{ padding: "var(--space-2)", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      openWelcomeModal();
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      padding: "var(--space-2) var(--space-3)",
                      borderRadius: "var(--radius-md)",
                      fontSize: "var(--fs-sm)",
                      color: "var(--primary-700)",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                      backgroundColor: "transparent",
                      border: "none",
                      transition: "background-color var(--motion-fast)",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--primary-50)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
                  >
                    <span aria-hidden="true">💡</span>
                    <span>แนะนำการใช้งานระบบ (Feature Tour)</span>
                  </button>

                  {/* Switch Persona Section */}
                  <div
                    style={{
                      padding: "8px 12px",
                      margin: "4px 0",
                      borderTop: "1px solid var(--border-subtle)",
                      borderBottom: "1px solid var(--border-subtle)",
                      backgroundColor: "var(--slate-50)",
                      borderRadius: "6px",
                    }}
                  >
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--slate-500)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                      สลับบทบาท (Quick Persona):
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      {[
                        { email: "broker@demo.local", role: "broker", label: "สมชาย (Broker)", icon: "👤" },
                        { email: "manager@demo.local", role: "manager", label: "สมศักดิ์ (Manager)", icon: "👔" },
                        { email: "admin@demo.local", role: "admin", label: "วิภา (Admin)", icon: "🛡️" },
                      ].map((item) => (
                        <button
                          key={item.email}
                          type="button"
                          disabled={switchingRole || user.email === item.email}
                          onClick={() => handleSwitchRole(item.email)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "6px 8px",
                            borderRadius: "4px",
                            border: "none",
                            backgroundColor: user.email === item.email ? "var(--primary-100)" : "transparent",
                            color: user.email === item.email ? "var(--primary-800)" : "var(--slate-700)",
                            fontSize: "12px",
                            fontWeight: user.email === item.email ? 700 : 500,
                            cursor: user.email === item.email ? "default" : "pointer",
                            textAlign: "left",
                          }}
                          onMouseEnter={(e) => {
                            if (user.email !== item.email) {
                              (e.currentTarget as HTMLElement).style.backgroundColor = "#E2E8F0";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (user.email !== item.email) {
                              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                            }
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                          </span>
                          {user.email === item.email && (
                            <span style={{ fontSize: "12px", color: "var(--primary-700)", fontWeight: 700 }}>Active</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

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
