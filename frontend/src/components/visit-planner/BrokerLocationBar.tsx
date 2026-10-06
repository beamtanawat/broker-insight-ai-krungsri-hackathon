"use client";
import React from "react";
import type { OfficeLocation, LocationPoint } from "@/types";
import { Badge } from "@/components/ui";

interface BrokerLocationBarProps {
  currentLocation: LocationPoint;
  onLocationChange: (loc: LocationPoint) => void;
  availableOffices: OfficeLocation[];
  selectedRadius: number | null; // 5, 10, 20, or null for all
  onRadiusChange: (radius: number | null) => void;
  sortBy: "distance" | "priority" | "name";
  onSortByChange: (sort: "distance" | "priority" | "name") => void;
  customerCount: number;
  loading?: boolean;
  locationSource?: "browser_gps" | "office_hub" | "manual";
  geoStatus?: "idle" | "requesting" | "success" | "denied" | "error";
  geoError?: string | null;
  onRequestGeolocation?: () => void;
}

const RADIUS_OPTIONS: { label: string; value: number | null; badge?: string }[] = [
  { label: "5 กม.", value: 5 },
  { label: "10 กม.", value: 10, badge: "ค่าเริ่มต้น" },
  { label: "20 กม.", value: 20 },
  { label: "ทั้งหมด", value: null },
];

export function BrokerLocationBar({
  currentLocation,
  onLocationChange,
  availableOffices,
  selectedRadius,
  onRadiusChange,
  sortBy,
  onSortByChange,
  customerCount,
  loading = false,
  locationSource = "office_hub",
  geoStatus = "idle",
  geoError = null,
  onRequestGeolocation,
}: BrokerLocationBarProps) {
  const handleOfficeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = availableOffices.find((o) => o.id === e.target.value);
    if (found) {
      onLocationChange({
        name: found.name,
        address: found.address,
        latitude: found.latitude,
        longitude: found.longitude,
      });
    }
  };

  const currentOfficeId =
    availableOffices.find(
      (o) =>
        Math.abs(o.latitude - currentLocation.latitude) < 0.001 &&
        Math.abs(o.longitude - currentLocation.longitude) < 0.001
    )?.id || "";

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        border: "1px solid var(--border-subtle, #e2e8f0)",
        borderRadius: "12px",
        padding: "16px 20px",
        marginBottom: "20px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* Geolocation Permission Denied / Error Banner */}
      {geoError && (
        <div
          style={{
            backgroundColor: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: "8px",
            padding: "10px 14px",
            marginBottom: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.8125rem",
            color: "#991B1B",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.1rem" }}>⚠️</span>
            <div>
              <span style={{ fontWeight: 700 }}>Unable to access your current location.</span>{" "}
              <span>ระบบใช้พิกัดสำนักงานสาขากรุงศรีที่เลือกเป็นจุดอ้างอิงแทนอย่างปลอดภัย (Graceful Fallback) โดยไม่สร้างพิกัดปลอม</span>
            </div>
          </div>
          {onRequestGeolocation && (
            <button
              type="button"
              onClick={onRequestGeolocation}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #FCA5A5",
                color: "#991B1B",
                borderRadius: "6px",
                padding: "3px 8px",
                fontSize: "0.75rem",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              ลองขอสิทธิ์ใหม่อีกครั้ง
            </button>
          )}
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        {/* Left: Broker Current Anchor Location */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "300px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: locationSource === "browser_gps" ? "rgba(34, 197, 94, 0.18)" : "rgba(254, 209, 0, 0.18)",
              border: locationSource === "browser_gps" ? "1px solid rgba(34, 197, 94, 0.4)" : "1px solid rgba(254, 209, 0, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.25rem",
              flexShrink: 0,
            }}
          >
            {locationSource === "browser_gps" ? "🛰️" : "📍"}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #64748b)", fontWeight: 600 }}>
                ตำแหน่งปัจจุบันของนายหน้า
              </span>
              {locationSource === "browser_gps" ? (
                <span style={{ fontSize: "0.75rem", backgroundColor: "#DCFCE7", color: "#166534", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
                  🟢 Live GPS
                </span>
              ) : (
                <span style={{ fontSize: "0.75rem", backgroundColor: "#FEF08A", color: "#854D0E", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
                  🏢 Office Hub (Fallback)
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
              <select
                aria-label="เลือกสำนักงานหรือตำแหน่งเริ่มต้น"
                value={currentOfficeId}
                onChange={handleOfficeSelect}
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "var(--krungsri-navy, #1e293b)",
                  border: "1px solid var(--slate-300, #cbd5e1)",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  backgroundColor: "#ffffff",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {availableOffices.map((office) => (
                  <option key={office.id} value={office.id}>
                    {office.name.replace("ธนาคารกรุงศรีอยุธยา ", "")} {office.is_headquarters ? "(สำนักงานใหญ่)" : ""}
                  </option>
                ))}
              </select>

              {onRequestGeolocation && (
                <button
                  type="button"
                  onClick={onRequestGeolocation}
                  disabled={geoStatus === "requesting"}
                  title="ขอสิทธิ์พิกัด GPS สดจากเบราว์เซอร์"
                  style={{
                    fontSize: "0.75rem",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--slate-300, #cbd5e1)",
                    backgroundColor: geoStatus === "requesting" ? "var(--slate-100, #f1f5f9)" : "#ffffff",
                    color: "var(--krungsri-navy, #1e293b)",
                    fontWeight: 600,
                    cursor: geoStatus === "requesting" ? "wait" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>📍</span>
                  <span>{geoStatus === "requesting" ? "กำลังขอ GPS..." : "ใช้ GPS ปัจจุบัน"}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Center: Configurable Radius Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--slate-600, #475569)" }}>
            รัศมีการค้นหา:
          </span>
          <div
            style={{
              display: "inline-flex",
              backgroundColor: "var(--slate-100, #f1f5f9)",
              borderRadius: "8px",
              padding: "3px",
              gap: "2px",
            }}
          >
            {RADIUS_OPTIONS.map((opt) => {
              const isActive = selectedRadius === opt.value;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => onRadiusChange(opt.value)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    fontSize: "0.8125rem",
                    fontWeight: isActive ? 700 : 500,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    backgroundColor: isActive ? "#ffffff" : "transparent",
                    color: isActive ? "var(--krungsri-navy, #0f172a)" : "var(--slate-600, #475569)",
                    boxShadow: isActive ? "0 1px 2px rgba(0, 0, 0, 0.1)" : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>{opt.label}</span>
                  {opt.badge && (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        backgroundColor: isActive ? "#FEF08A" : "var(--slate-200, #e2e8f0)",
                        color: "#854D0E",
                        fontWeight: 700,
                      }}
                    >
                      {opt.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Sort & Summary Pill */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--slate-500, #64748b)", fontWeight: 500 }}>
              เรียงตาม:
            </span>
            <select
              aria-label="เรียงลำดับลูกค้า"
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as "distance" | "priority" | "name")}
              style={{
                fontSize: "0.8125rem",
                padding: "5px 8px",
                borderRadius: "6px",
                border: "1px solid var(--slate-300, #cbd5e1)",
                backgroundColor: "#ffffff",
                color: "var(--slate-700, #334155)",
                fontWeight: 600,
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="distance">ระยะทางใกล้สุด (Nearest)</option>
              <option value="priority">ความสำคัญสูงสุด (AI Priority)</option>
              <option value="name">ชื่อลูกค้า (Name)</option>
            </select>
          </div>

          <Badge variant="krungsri" size="md">
            {loading ? "กำลังค้นหา..." : `พบลูกค้า ${customerCount} ราย ในรัศมี ${selectedRadius ? `${selectedRadius} กม.` : "ทั้งหมด"}`}
          </Badge>
        </div>
      </div>
    </div>
  );
}
