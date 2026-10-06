"use client";
import React, { useState, useEffect } from "react";
import type { CandidateCustomerOut, LocationPoint, SingleCustomerNavigationResponse } from "@/types";
import { api } from "@/lib/api";

// ─── Props ────────────────────────────────────────────────────────────────────

interface CustomerDecisionPanelProps {
  selectedCustomer: CandidateCustomerOut | null;
  brokerLocation: LocationPoint;
  onClearSelection?: () => void;
  onViewCustomerDetail?: (customer: CandidateCustomerOut) => void;
  onCompleteVisit?: (customer: CandidateCustomerOut) => void;
  onCancelNavigation?: () => void;
  onNavActiveChange?: (active: boolean) => void;
}

/** Navigation state machine:
 *  idle          → broker sees customer detail, decides whether to route
 *  route_preview → backend route data loaded, broker decides whether to start nav
 *  navigating    → broker has launched Google Maps, active nav panel shown
 */
type NavState = "idle" | "route_preview" | "navigating";

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const color =
    score >= 85 ? "#DC2626" : score >= 70 ? "#EA580C" : score >= 50 ? "#D97706" : "#16A34A";
  const trackColor =
    score >= 85 ? "#FEE2E2" : score >= 70 ? "#FED7AA" : score >= 50 ? "#FEF3C7" : "#DCFCE7";
  const size = 72;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - strokeDash}
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1px",
        }}
      >
        <span style={{ fontSize: "1.375rem", fontWeight: 900, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94A3B8", lineHeight: 1 }}>คะแนน</span>
      </div>
    </div>
  );
}

const PRODUCT_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  Motor: { bg: "#FAF7F6", color: "#5a4544", label: "Motor (รถยนต์)" },
  Health: { bg: "#F0FDF4", color: "#16A34A", label: "Health (สุขภาพ)" },
  Savings: { bg: "#F0FDFA", color: "#0D9488", label: "Savings (ออมเงิน)" },
  Protection: { bg: "#FFF7ED", color: "#EA580C", label: "Protection (คุ้มครอง)" },
  AUM: { bg: "#FAF5FF", color: "#9333EA", label: "AUM / Pension" },
  Pension: { bg: "#FAF5FF", color: "#9333EA", label: "Pension" },
  Loan: { bg: "#F8FAFC", color: "#475569", label: "Loan (สินเชื่อ)" },
};

function getProductColor(tag: string) {
  const key = Object.keys(PRODUCT_COLORS).find((k) => tag.includes(k));
  return key ? PRODUCT_COLORS[key] : { bg: "#F1F5F9", color: "#475569", label: tag };
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "12px",
        padding: "5px 0",
        borderBottom: "1px solid #F8FAFC",
      }}
    >
      <span style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 500, flexShrink: 0 }}>{label}</span>
      <span
        style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: valueColor || "#1E293B",
          textAlign: "right",
          wordBreak: "break-word",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CustomerDecisionPanel({
  selectedCustomer,
  brokerLocation,
  onViewCustomerDetail,
  onCompleteVisit,
  onCancelNavigation,
  onNavActiveChange,
}: CustomerDecisionPanelProps) {
  const [navState, setNavState] = useState<NavState>("idle");
  const [navData, setNavData] = useState<SingleCustomerNavigationResponse | null>(null);
  const [navLoading, setNavLoading] = useState(false);
  const [navError, setNavError] = useState<string | null>(null);
  const [addedToTasks, setAddedToTasks] = useState(false);

  // Reset navigation state whenever the selected customer changes
  useEffect(() => {
    setNavState("idle");
    setNavData(null);
    setNavError(null);
    setNavLoading(false);
    onNavActiveChange?.(false);
  }, [selectedCustomer?.customer_id, onNavActiveChange]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  /**
   * Calls backend /navigate for authoritative distance, travel time, and maps URL.
   * Enforces RBAC server-side. Transitions to route_preview on success.
   */
  const handleRequestRoute = async () => {
    if (!selectedCustomer) return;

    if (!selectedCustomer.latitude || !selectedCustomer.longitude) {
      setNavError("ไม่สามารถนำทางไปยังลูกค้ารายนี้ได้ เนื่องจากไม่มีข้อมูลตำแหน่ง");
      return;
    }

    setNavLoading(true);
    setNavError(null);

    try {
      const data = await api.visitPlanner.navigate({
        customer_id: selectedCustomer.customer_id,
        broker_lat: brokerLocation.latitude,
        broker_lng: brokerLocation.longitude,
        broker_location_name: brokerLocation.name || undefined,
      });
      setNavData(data);
      setNavState("route_preview");
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err);
      if (raw.includes("403") || raw.toLowerCase().includes("forbidden") || raw.toLowerCase().includes("access denied")) {
        setNavError("ไม่มีสิทธิ์เข้าถึงข้อมูลลูกค้ารายนี้");
      } else if (raw.toLowerCase().includes("coordinates") || raw.toLowerCase().includes("gps") || raw.toLowerCase().includes("location")) {
        setNavError("ไม่สามารถนำทางไปยังลูกค้ารายนี้ได้ เนื่องจากไม่มีข้อมูลตำแหน่ง");
      } else if (raw.toLowerCase().includes("404") || raw.toLowerCase().includes("not found")) {
        setNavError("ไม่พบข้อมูลลูกค้ารายนี้");
      } else {
        setNavError("ไม่สามารถคำนวณเส้นทางได้ในขณะนี้ — ลองอีกครั้ง");
      }
    } finally {
      setNavLoading(false);
    }
  };

  /**
   * Opens authoritative Google Maps deep-link (from backend), transitions to navigating state.
   * The broker must explicitly click this — no automatic navigation.
   */
  const handleStartNavigation = () => {
    const url =
      navData?.external_maps_url ||
      (selectedCustomer?.latitude && selectedCustomer?.longitude
        ? `https://www.google.com/maps/dir/?api=1&origin=${brokerLocation.latitude},${brokerLocation.longitude}&destination=${selectedCustomer.latitude},${selectedCustomer.longitude}&travelmode=driving`
        : null);

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    setNavState("navigating");
    onNavActiveChange?.(true);
  };

  /** Cancels navigation — returns broker to customer detail view. */
  const handleCancelNavigation = () => {
    setNavState("idle");
    setNavData(null);
    onNavActiveChange?.(false);
    onCancelNavigation?.();
  };

  const handleAddToTasks = () => {
    setAddedToTasks(true);
    setTimeout(() => setAddedToTasks(false), 3000);
  };

  // ── Empty state ──────────────────────────────────────────────────────────────

  if (!selectedCustomer) {
    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          padding: "48px 28px",
          textAlign: "center",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "#F1F5F9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.75rem",
            marginBottom: "4px",
          }}
        >
          🎯
        </div>
        <div style={{ fontSize: "1rem", fontWeight: 800, color: "#1E293B" }}>
          เลือกลูกค้าจากรายชื่อหรือแผนที่
        </div>
        <div style={{ fontSize: "0.8125rem", color: "#94A3B8", maxWidth: "240px", lineHeight: 1.5 }}>
          คลิกที่การ์ดลูกค้าหรือหมุดบนแผนที่เพื่อดูข้อมูลเชิงลึกและเริ่มการนำทาง
        </div>
        <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
          {["📊 คะแนน AI", "📍 ระยะทาง", "🚀 นำทาง"].map((item) => (
            <span
              key={item}
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                color: "#475569",
                padding: "3px 8px",
                borderRadius: "6px",
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // ── Computed values ──────────────────────────────────────────────────────────

  const score = selectedCustomer.priority_score ?? 94;
  const initial = selectedCustomer.customer_name.trim().charAt(0) || "ณ";

  // Prefer backend-authoritative values; fallback to haversine estimate
  const displayDistKm = navData?.distance_km ?? selectedCustomer.distance_km ?? 2.1;
  const displayTimeMins =
    navData?.estimated_travel_time_minutes ?? Math.max(3, Math.round(displayDistKm * 2.5 + 2));
  const isBackendData = !!navData;

  const whyNow = navData?.why_now ?? selectedCustomer.why_now;
  const recAction = navData?.recommended_next_action ?? selectedCustomer.recommended_next_action;

  const productTags =
    selectedCustomer.product_tags && selectedCustomer.product_tags.length > 0
      ? selectedCustomer.product_tags
      : ["Health", "Savings"];

  // ── NAVIGATING STATE — full active nav panel ─────────────────────────────────

  if (navState === "navigating") {
    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Active nav header */}
        <div
          style={{
            background: "linear-gradient(135deg, #15803D 0%, #166534 100%)",
            padding: "16px 20px",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "1.25rem" }}>🚗</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#86EFAC", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              กำลังนำทางไปหาลูกค้า
            </span>
          </div>
          <div style={{ fontSize: "1.0625rem", fontWeight: 800, color: "#ffffff" }}>
            {selectedCustomer.customer_name}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#BBF7D0", marginTop: "2px" }}>
            {selectedCustomer.external_ref} • {selectedCustomer.district || "กรุงเทพมหานคร"}
          </div>
        </div>

        {/* Route summary */}
        <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* From → To */}
          <div style={{ backgroundColor: "#F8FAFC", borderRadius: "12px", padding: "14px", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#5a4544", marginTop: "4px", flexShrink: 0, boxShadow: "0 0 0 3px #F2ECEB" }} />
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>จาก</div>
                  <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#334155" }}>
                    {brokerLocation.name || "ตำแหน่งปัจจุบันของคุณ"}
                  </div>
                </div>
              </div>
              <div style={{ marginLeft: "4px", width: "2px", height: "14px", background: "repeating-linear-gradient(to bottom, #CBD5E1 0px, #CBD5E1 4px, transparent 4px, transparent 8px)" }} />
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#16A34A", marginTop: "4px", flexShrink: 0, boxShadow: "0 0 0 3px #DCFCE7" }} />
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>ปลายทาง</div>
                  <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#0F172A" }}>
                    {selectedCustomer.customer_name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                    {selectedCustomer.address || selectedCustomer.district || "กรุงเทพมหานคร"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Distance & Time */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div style={{ backgroundColor: "#FAF7F6", borderRadius: "12px", padding: "14px 16px", border: "1px solid #E2DAD9", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "#5a4544", fontWeight: 700, marginBottom: "4px" }}>
                {isBackendData ? "ระยะทาง (ถนน)" : "ระยะทาง (ประมาณ)"}
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#5a4544", lineHeight: 1 }}>
                {displayDistKm}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#5a4544", fontWeight: 600 }}>กิโลเมตร</div>
            </div>
            <div style={{ backgroundColor: "#F0FDF4", borderRadius: "12px", padding: "14px 16px", border: "1px solid #BBF7D0", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "#16A34A", fontWeight: 700, marginBottom: "4px" }}>เวลาโดยประมาณ</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#15803D", lineHeight: 1 }}>
                ~{displayTimeMins}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#16A34A", fontWeight: 600 }}>นาที</div>
            </div>
          </div>

          {/* Info note */}
          <div
            style={{
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "0.75rem",
              color: "#64748B",
              lineHeight: 1.45,
            }}
          >
            {isBackendData
              ? "⚡ ระยะทางและเวลาคำนวณตามความเร็วเฉลี่ยในเมือง — ไม่รวมสภาพการจราจรแบบเรียลไทม์"
              : "📍 ระยะทางประมาณการตามพิกัดภูมิศาสตร์ (Haversine)"}
          </div>

          {/* Google Maps already open notice */}
          <div
            style={{
              backgroundColor: "#ECFDF5",
              border: "1px solid #A7F3D0",
              borderRadius: "10px",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "1.25rem" }}>📱</span>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#065F46" }}>
                Google Maps เปิดแล้วในแท็บใหม่
              </div>
              <div style={{ fontSize: "0.75rem", color: "#047857" }}>
                เมื่อถึงที่หมายแล้ว กดปุ่ม "เสร็จสิ้น" ด้านล่าง
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "auto" }}>
            {onCompleteVisit && (
              <button
                type="button"
                onClick={() => {
                  onNavActiveChange?.(false);
                  onCompleteVisit(selectedCustomer);
                }}
                style={{
                  background: "linear-gradient(135deg, #15803D 0%, #16A34A 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "12px",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 2px 8px rgba(21,128,61,0.3)",
                  transition: "all 0.15s ease",
                }}
              >
                <span>✅</span>
                <span>เสร็จสิ้นการเข้าพบ — กลับดูลูกค้าใกล้เคียง</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleCancelNavigation}
              style={{
                backgroundColor: "#F1F5F9",
                color: "#475569",
                border: "1px solid #E2E8F0",
                borderRadius: "10px",
                padding: "10px",
                fontSize: "0.8125rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#E2E8F0"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#F1F5F9"; }}
            >
              <span>←</span>
              <span>ยกเลิกการนำทาง — กลับดูรายชื่อลูกค้า</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── IDLE / ROUTE_PREVIEW states ───────────────────────────────────────────────

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        border: "1px solid #E2E8F0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Customer Header — gradient banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
          padding: "18px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexShrink: 0,
        }}
      >
        {/* Avatar + Name */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              backgroundColor: "#EDE9FE",
              color: "#6D28D9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.375rem",
              fontWeight: 900,
              flexShrink: 0,
              boxShadow: "0 0 0 3px rgba(139,92,246,0.3)",
            }}
          >
            {initial}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: "1rem",
                fontWeight: 800,
                color: "#ffffff",
                marginBottom: "5px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {selectedCustomer.customer_name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
              {(selectedCustomer.priority_level === "high" || (selectedCustomer.priority_score ?? 0) >= 75) && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    color: "#FCA5A5",
                    backgroundColor: "rgba(220,38,38,0.2)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    border: "1px solid rgba(220,38,38,0.3)",
                    letterSpacing: "0.02em",
                  }}
                >
                  🔥 HIGH PRIORITY
                </span>
              )}
              {selectedCustomer.kyc_status === "verified" && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    color: "#86EFAC",
                    backgroundColor: "rgba(22,163,74,0.2)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    border: "1px solid rgba(22,163,74,0.3)",
                    letterSpacing: "0.02em",
                  }}
                >
                  ✓ KYC แล้ว
                </span>
              )}
              {navState === "route_preview" && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    color: "#FCD34D",
                    backgroundColor: "rgba(234,179,8,0.2)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    border: "1px solid rgba(234,179,8,0.3)",
                    letterSpacing: "0.02em",
                  }}
                >
                  📍 ดูเส้นทาง
                </span>
              )}
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#94A3B8",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}
              >
                {selectedCustomer.external_ref}
              </span>
            </div>
          </div>
        </div>

        {/* Score Gauge */}
        <ScoreGauge score={score} />
      </div>

      {/* ── Action button bar — state-aware ── */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #F1F5F9",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: "#FAFBFC",
          flexShrink: 0,
        }}
      >
        {navState === "idle" ? (
          <>
            {/* Primary: request route (broker decides to check, not auto-navigate) */}
            <button
              type="button"
              onClick={handleRequestRoute}
              disabled={navLoading}
              style={{
                flex: 1,
                background: navLoading
                  ? "linear-gradient(135deg, #A89B9A 0%, #8C7E7D 100%)"
                  : "linear-gradient(135deg, #4a3837 0%, #5a4544 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "10px 16px",
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: navLoading ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                boxShadow: "0 2px 8px rgba(90,69,68,0.3)",
                transition: "all 0.15s ease",
              }}
            >
              {navLoading ? (
                <>
                  <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
                  <span>กำลังคำนวณเส้นทาง...</span>
                </>
              ) : (
                <>
                  <span>🗺️</span>
                  <span>ดูเส้นทางไปหาลูกค้า</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleAddToTasks}
              style={{
                backgroundColor: addedToTasks ? "#F0FDF4" : "#ffffff",
                color: addedToTasks ? "#16A34A" : "#475569",
                border: `1px solid ${addedToTasks ? "#86EFAC" : "#E2E8F0"}`,
                borderRadius: "10px",
                padding: "10px 14px",
                fontSize: "0.8125rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <span>{addedToTasks ? "✓" : "📋"}</span>
              <span>{addedToTasks ? "เพิ่มแล้ว" : "บันทึก"}</span>
            </button>
            <button
              type="button"
              onClick={() => onViewCustomerDetail && onViewCustomerDetail(selectedCustomer)}
              title="ดูรายละเอียดลูกค้าเต็มรูปแบบ"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#ffffff",
                color: "#64748B",
                fontSize: "1.125rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F8FAFC"; e.currentTarget.style.borderColor = "#CBD5E1"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#ffffff"; e.currentTarget.style.borderColor = "#E2E8F0"; }}
            >
              ⋮
            </button>
          </>
        ) : (
          /* route_preview: explicit "Start Navigation" — broker must choose */
          <>
            <button
              type="button"
              onClick={handleStartNavigation}
              style={{
                flex: 1,
                background: "linear-gradient(135deg, #15803D 0%, #16A34A 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "10px 16px",
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                boxShadow: "0 2px 8px rgba(21,128,61,0.3)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
            >
              <span>🚀</span>
              <span>เริ่มนำทางไปหาลูกค้าคนนี้</span>
            </button>
            <button
              type="button"
              onClick={() => { setNavState("idle"); setNavData(null); setNavError(null); }}
              style={{
                backgroundColor: "#F1F5F9",
                color: "#475569",
                border: "1px solid #E2E8F0",
                borderRadius: "10px",
                padding: "10px 14px",
                fontSize: "0.8125rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <span>←</span>
              <span>กลับ</span>
            </button>
          </>
        )}
      </div>

      {/* Error banner */}
      {navError && (
        <div
          style={{
            padding: "8px 16px",
            backgroundColor: "#FEF2F2",
            borderBottom: "1px solid #FECACA",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          <span>⚠️</span>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#991B1B", flex: 1 }}>{navError}</span>
          <button
            type="button"
            onClick={() => setNavError(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626", fontSize: "0.875rem", padding: "0 4px" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #F1F5F9",
          backgroundColor: "#ffffff",
          flexShrink: 0,
        }}
      >
        {(["info", "route"] as const).map((tab) => {
          const isActive = navState === "route_preview" ? tab === "route" : tab === "info";
          return (
            <button
              key={tab}
              type="button"
              onClick={() => {
                if (tab === "route" && navState === "idle") {
                  void handleRequestRoute();
                } else {
                  setNavState("idle");
                  setNavData(null);
                }
              }}
              style={{
                flex: 1,
                padding: "10px 16px",
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: isActive ? "#5a4544" : "#94A3B8",
                border: "none",
                borderBottom: isActive ? "2px solid #5a4544" : "2px solid transparent",
                backgroundColor: "transparent",
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
              }}
            >
              <span>{tab === "info" ? "👤" : "🗺️"}</span>
              <span>{tab === "info" ? "ข้อมูลลูกค้า" : "เส้นทาง"}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {/* ══ ROUTE_PREVIEW TAB ══ */}
        {navState === "route_preview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Route From → To */}
            <div style={{ backgroundColor: "#F8FAFC", borderRadius: "12px", padding: "14px", border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#475569", marginBottom: "10px", display: "flex", alignItems: "center", gap: "5px" }}>
                <span>🗺️</span><span>เส้นทางการเดินทาง</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#5a4544", marginTop: "4px", flexShrink: 0, boxShadow: "0 0 0 3px #F2ECEB" }} />
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>จุดเริ่มต้น</div>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#334155" }}>
                      {navData?.origin?.name ?? brokerLocation.name ?? "ตำแหน่งปัจจุบันของคุณ"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                      {brokerLocation.latitude.toFixed(4)}, {brokerLocation.longitude.toFixed(4)}
                    </div>
                  </div>
                </div>
                <div style={{ marginLeft: "4px", width: "2px", height: "16px", background: "repeating-linear-gradient(to bottom, #CBD5E1 0px, #CBD5E1 4px, transparent 4px, transparent 8px)" }} />
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#16A34A", marginTop: "4px", flexShrink: 0, boxShadow: "0 0 0 3px #DCFCE7" }} />
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>ปลายทาง</div>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#0F172A" }}>
                      {navData?.destination?.name ?? selectedCustomer.customer_name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                      {selectedCustomer.address || navData?.destination?.address || selectedCustomer.district || "กรุงเทพมหานคร"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Distance & Time from backend */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ backgroundColor: "#FAF7F6", borderRadius: "12px", padding: "14px 16px", border: "1px solid #E2DAD9", textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "#5a4544", fontWeight: 700, marginBottom: "4px" }}>ระยะทาง (ถนน)</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#4a3837", lineHeight: 1 }}>{displayDistKm}</div>
                <div style={{ fontSize: "0.75rem", color: "#5a4544", fontWeight: 600 }}>กิโลเมตร</div>
              </div>
              <div style={{ backgroundColor: "#F0FDF4", borderRadius: "12px", padding: "14px 16px", border: "1px solid #BBF7D0", textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "#16A34A", fontWeight: 700, marginBottom: "4px" }}>เวลาโดยประมาณ</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#15803D", lineHeight: 1 }}>~{displayTimeMins}</div>
                <div style={{ fontSize: "0.75rem", color: "#16A34A", fontWeight: 600 }}>นาที</div>
              </div>
            </div>

            {/* Disclaimer */}
            <div style={{ fontSize: "0.75rem", color: "#94A3B8", textAlign: "center", lineHeight: 1.45 }}>
              ⚡ ระยะทางและเวลาคำนวณตามความเร็วเฉลี่ยในเมือง (24 กม./ชม.) — ไม่รวมสภาพจราจรเรียลไทม์
            </div>

            {/* AI Why Now reinforcement */}
            {whyNow && (
              <div style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A", borderLeft: "3px solid #F59E0B", borderRadius: "8px", padding: "10px 12px" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#92400E", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>⚡</span><span>ทำไมต้องเข้าพบตอนนี้</span>
                </div>
                <div style={{ fontSize: "0.8125rem", color: "#92400E", lineHeight: "var(--lh-reading, 1.7)", fontFamily: "var(--font-reading-thai)" }}>{whyNow}</div>
              </div>
            )}

            {/* AI rec action */}
            {recAction && (
              <div style={{ backgroundColor: "#FAF7F6", border: "1px solid #E2DAD9", borderRadius: "8px", padding: "10px 12px" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#4a3837", marginBottom: "4px" }}>
                  AI แนะนำการดำเนินการ
                </div>
                <div style={{ fontSize: "0.8125rem", color: "#291f1e", lineHeight: "var(--lh-reading, 1.7)", fontFamily: "var(--font-reading-thai)" }}>{recAction}</div>
              </div>
            )}
          </div>
        )}

        {/* ══ INFO TAB (idle state) ══ */}
        {navState === "idle" && (
          <>
            {/* General Info */}
            <div style={{ backgroundColor: "#F8FAFC", borderRadius: "12px", padding: "12px 14px", border: "1px solid #F1F5F9" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#475569", marginBottom: "8px", display: "flex", alignItems: "center", gap: "5px" }}>
                <span>👤</span><span>ข้อมูลทั่วไป</span>
              </div>
              <InfoRow label="รหัสลูกค้า" value={selectedCustomer.external_ref} />
              <InfoRow label="อายุ" value={selectedCustomer.age ? `${selectedCustomer.age} ปี` : "—"} />
              <InfoRow label="อาชีพ" value={selectedCustomer.occupation || "—"} />
              <InfoRow label="ที่อยู่" value={selectedCustomer.address || selectedCustomer.district || "กรุงเทพมหานคร"} />
              <InfoRow
                label="ระยะทาง"
                value={`${displayDistKm} กม.${isBackendData ? " (ถนน)" : " (ประมาณ)"} · ~${displayTimeMins} นาที`}
                valueColor="#5a4544"
              />
              {selectedCustomer.phone && (
                <InfoRow label="เบอร์โทร" value={selectedCustomer.phone} />
              )}
              {selectedCustomer.email && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "5px 0" }}>
                  <span style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 500 }}>อีเมล</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1E293B", textDecoration: "underline", cursor: "pointer" }}>
                    {selectedCustomer.email}
                  </span>
                </div>
              )}
            </div>

            {/* Products / Interests */}
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#475569", marginBottom: "8px", display: "flex", alignItems: "center", gap: "5px" }}>
                <span>💡</span><span>ความสนใจ / โอกาสแนะนำ</span>
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                {productTags.map((t, i) => {
                  const s = getProductColor(t.split(" ")[0]);
                  return (
                    <span
                      key={i}
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: s.color,
                        backgroundColor: s.bg,
                        padding: "3px 10px",
                        borderRadius: "6px",
                      }}
                    >
                      {s.label || t}
                    </span>
                  );
                })}
              </div>

              {/* Why Now */}
              {whyNow && (
                <div
                  style={{
                    fontSize: "0.8125rem",
                    fontFamily: "var(--font-reading-thai)",
                    color: "#92400E",
                    backgroundColor: "#FFFBEB",
                    border: "1px solid #FDE68A",
                    borderLeft: "3px solid #F59E0B",
                    borderRadius: "6px",
                    padding: "8px 10px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "6px",
                    lineHeight: "var(--lh-reading, 1.7)",
                  }}
                >
                  <span style={{ flexShrink: 0 }}>⚡</span>
                  <span>{whyNow}</span>
                </div>
              )}
            </div>

            {/* Contact History */}
            {selectedCustomer.contact_history && (
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#475569", marginBottom: "8px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span>📋</span><span>ประวัติการติดต่อ</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", backgroundColor: "#F8FAFC", borderRadius: "10px", border: "1px solid #F1F5F9", overflow: "hidden" }}>
                  {[
                    { icon: "📞", type: "โทรครั้งล่าสุด", date: selectedCustomer.contact_history.last_call, detail: selectedCustomer.contact_history.last_call_detail },
                    { icon: "🤝", type: "นัดพบ", date: selectedCustomer.contact_history.appointment, detail: selectedCustomer.contact_history.appointment_detail },
                    { icon: "📄", type: "ส่งเอกสาร", date: selectedCustomer.contact_history.sent_doc, detail: selectedCustomer.contact_history.sent_doc_detail },
                  ].filter((item) => item.date || item.detail).map((item, i, arr) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderBottom: i < arr.length - 1 ? "1px solid #F1F5F9" : "none",
                        gap: "8px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                        <span style={{ fontSize: "0.875rem" }}>{item.icon}</span>
                        <div>
                          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155" }}>{item.type}</div>
                          <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>{item.date || "—"}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748B", textAlign: "right", flexShrink: 0 }}>
                        {item.detail || "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Insight — framed as decision support, not command */}
            <div
              style={{
                background: "linear-gradient(135deg, #FAF7F6 0%, #F2ECEB 100%)",
                border: "1px solid #E2DAD9",
                borderRadius: "12px",
                padding: "12px 14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 800, color: "#4a3837", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span>🤖</span><span>AI วิเคราะห์ว่า</span>
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 900,
                    backgroundColor: "#5a4544",
                    color: "#ffffff",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    letterSpacing: "0.05em",
                  }}
                >
                  AI INSIGHT
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.8125rem", fontFamily: "var(--font-reading-thai)", color: "#291f1e", lineHeight: "var(--lh-reading, 1.7)" }}>
                {selectedCustomer.ai_note ||
                  "ลูกค้ารายนี้มีความสำคัญสูงตามการวิเคราะห์ของ AI — คุณเป็นผู้ตัดสินใจว่าจะเข้าพบหรือไม่"}
              </p>
              {recAction && (
                <div style={{ marginTop: "6px", fontSize: "0.8125rem", fontFamily: "var(--font-reading-thai)", color: "#4a3837", fontWeight: 600, lineHeight: "var(--lh-reading, 1.7)" }}>
                  💡 การดำเนินการที่แนะนำ: {recAction}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
