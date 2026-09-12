"use client";
import React from "react";
import type { LocationPoint } from "@/types";
import { AVAILABLE_LOCATION_PRESETS } from "@/lib/nearbyMockData";

interface NearbyFilterBarProps {
  currentLocation: LocationPoint;
  onLocationChange: (loc: LocationPoint) => void;
  radiusKm: number | null;
  onRadiusChange: (radius: number | null) => void;
  priorityFilter: string;
  onPriorityFilterChange: (val: string) => void;
  productFilter: string;
  onProductFilterChange: (val: string) => void;
  kycFilter: string;
  onKycFilterChange: (val: string) => void;
  onRequestGeolocation?: () => void;
  geoStatus?: "idle" | "requesting" | "success" | "denied" | "error";
  locationTimestamp?: Date | null;
}

const RADIUS_OPTIONS = [
  { value: 5, label: "5 กม." },
  { value: 10, label: "10 กม." },
  { value: 20, label: "20 กม." },
  { value: "all", label: "ทั้งหมด" },
];

interface FilterPillProps {
  label: string;
  icon?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

function FilterPill({ label, icon, value, onChange, options }: FilterPillProps) {
  const isActive = value !== "all";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "5px",
        backgroundColor: isActive ? "#FAF7F6" : "#F8FAFC",
        border: `1px solid ${isActive ? "#E2DAD9" : "#E2E8F0"}`,
        borderRadius: "10px",
        padding: "6px 12px",
        transition: "all 0.15s ease",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      {icon && (
        <span style={{ fontSize: "0.875rem", lineHeight: 1 }}>{icon}</span>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
        <span
          style={{
            fontSize: "0.75rem",
            color: isActive ? "#5a4544" : "#94A3B8",
            fontWeight: 600,
            lineHeight: 1,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            border: "none",
            backgroundColor: "transparent",
            outline: "none",
            fontSize: "0.8125rem",
            fontWeight: 700,
            color: isActive ? "#5a4544" : "#334155",
            cursor: "pointer",
            padding: 0,
            lineHeight: 1.2,
            minWidth: "60px",
          }}
        >
          {options.map((opt) => (
            <option key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function NearbyFilterBar({
  currentLocation,
  onLocationChange,
  radiusKm = 10,
  onRadiusChange,
  priorityFilter,
  onPriorityFilterChange,
  productFilter,
  onProductFilterChange,
  kycFilter,
  onKycFilterChange,
  onRequestGeolocation,
  geoStatus = "idle",
  locationTimestamp,
}: NearbyFilterBarProps) {
  const handleLocationSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "LIVE_GPS" && onRequestGeolocation) {
      onRequestGeolocation();
      return;
    }
    const found = AVAILABLE_LOCATION_PRESETS.find((p) => p.name === val);
    if (found) {
      onLocationChange(found);
    }
  };

  // Format how long ago the location was obtained
  const getTimestampLabel = () => {
    if (!locationTimestamp) return null;
    const diffMs = Date.now() - locationTimestamp.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "เมื่อสักครู่";
    if (diffMin === 1) return "1 นาทีที่แล้ว";
    if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
    const diffHr = Math.floor(diffMin / 60);
    return `${diffHr} ชั่วโมงที่แล้ว`;
  };

  const isStale = locationTimestamp && (Date.now() - locationTimestamp.getTime()) > 15 * 60 * 1000;

  const hasActiveFilters =
    priorityFilter !== "all" || productFilter !== "all" || kycFilter !== "all" || radiusKm !== 10;

  // Location status widget styles by state
  const locationStyles = {
    requesting: { bg: "#FAF7F6", border: "#E2DAD9", iconBg: "#5a4544", labelColor: "#4a3837" },
    success: { bg: isStale ? "#FFFBEB" : "#F0FDF4", border: isStale ? "#FCD34D" : "#86EFAC", iconBg: isStale ? "#D97706" : "#16A34A", labelColor: isStale ? "#92400E" : "#166534" },
    denied: { bg: "#FEF2F2", border: "#FCA5A5", iconBg: "#DC2626", labelColor: "#991B1B" },
    error: { bg: "#FEF2F2", border: "#FCA5A5", iconBg: "#DC2626", labelColor: "#991B1B" },
    idle: { bg: "#F0F9FF", border: "#BAE6FD", iconBg: "#0EA5E9", labelColor: "#0369A1" },
  };
  const lStyle = locationStyles[(geoStatus as keyof typeof locationStyles)] || locationStyles.idle;

  const locationIcon =
    geoStatus === "requesting" ? "⏳"
    : geoStatus === "success" ? (isStale ? "⚠️" : "📍")
    : geoStatus === "denied" ? "🚫"
    : geoStatus === "error" ? "⚠️"
    : "📍";

  const locationLabel =
    geoStatus === "requesting" ? "กำลังตรวจสอบตำแหน่งของคุณ..."
    : geoStatus === "success" ? "ตำแหน่งปัจจุบันของคุณ"
    : geoStatus === "denied" ? "ไม่สามารถเข้าถึงตำแหน่งของคุณได้"
    : geoStatus === "error" ? "ไม่สามารถระบุตำแหน่งได้"
    : "ตำแหน่งของฉัน";

  const locationSubLabel =
    geoStatus === "requesting" ? null
    : geoStatus === "success" && locationTimestamp ? getTimestampLabel()
    : geoStatus === "denied" ? "ต้องการสิทธิ์การเข้าถึงตำแหน่ง"
    : geoStatus === "error" ? "ลองรีเฟรชตำแหน่ง"
    : (currentLocation.name ?? "").length > 28 ? (currentLocation.name ?? "").slice(0, 28) + "..." : (currentLocation.name ?? "");

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "14px",
        padding: "10px 14px",
        marginBottom: "16px",
        border: "1px solid #E2E8F0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "8px",
      }}
      className="nearby-filter-bar"
    >
      {/* Location Status Widget — changes by geoStatus */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: lStyle.bg,
          border: `1px solid ${lStyle.border}`,
          borderRadius: "10px",
          padding: "7px 12px",
          flex: "1 1 260px",
          minWidth: "220px",
          transition: "all 0.2s ease",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            backgroundColor: lStyle.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.875rem",
            flexShrink: 0,
          }}
        >
          {locationIcon}
        </div>

        {/* Text block */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "0.75rem",
              color: lStyle.labelColor,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              lineHeight: 1,
            }}
          >
            {locationLabel}
          </div>
          {locationSubLabel && (
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: lStyle.labelColor,
                lineHeight: 1.3,
                marginTop: "2px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {locationSubLabel}
            </div>
          )}
        </div>

        {/* Action button on right */}
        {geoStatus === "success" && !isStale && (
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#22C55E",
              flexShrink: 0,
              boxShadow: "0 0 0 2px #DCFCE7",
            }}
          />
        )}
        {(geoStatus === "denied" || geoStatus === "error" || (geoStatus === "success" && isStale)) && onRequestGeolocation && (
          <button
            type="button"
            onClick={onRequestGeolocation}
            style={{
              backgroundColor: lStyle.iconBg,
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "3px 8px",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {geoStatus === "denied" ? "ลองอีกครั้ง" : "รีเฟรช"}
          </button>
        )}
        {geoStatus === "idle" && onRequestGeolocation && (
          <button
            type="button"
            onClick={onRequestGeolocation}
            style={{
              backgroundColor: "#0EA5E9",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "3px 8px",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            ขอ GPS
          </button>
        )}

        {/* Location select — always available as fallback */}
        {(geoStatus === "idle" || geoStatus === "denied" || geoStatus === "error") && (
          <select
            aria-label="เลือกตำแหน่งสำรอง"
            value={currentLocation.name || ""}
            onChange={handleLocationSelect}
            style={{
              border: "1px solid #E2E8F0",
              backgroundColor: "#ffffff",
              borderRadius: "6px",
              outline: "none",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#334155",
              cursor: "pointer",
              padding: "2px 4px",
              maxWidth: "120px",
              flexShrink: 0,
            }}
          >
            {AVAILABLE_LOCATION_PRESETS.map((loc) => (
              <option key={loc.name ?? ""} value={loc.name ?? ""}>
                {(loc.name ?? "").length > 20 ? (loc.name ?? "").slice(0, 20) + "..." : (loc.name ?? "")}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Divider */}
      <div style={{ width: "1px", height: "32px", backgroundColor: "#E2E8F0", flexShrink: 0 }} className="filter-divider" />

      {/* Radius Selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          backgroundColor: "#F8FAFC",
          border: "1px solid #E2E8F0",
          borderRadius: "10px",
          padding: "6px 12px",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: "0.875rem" }}>🎯</span>
        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
          <span style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            รัศมี
          </span>
          <select
            aria-label="เลือกรัศมี"
            value={radiusKm !== null ? String(radiusKm) : "all"}
            onChange={(e) => onRadiusChange(e.target.value === "all" ? null : Number(e.target.value))}
            style={{
              border: "none",
              backgroundColor: "transparent",
              outline: "none",
              fontSize: "0.8125rem",
              fontWeight: 700,
              color: "#334155",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {RADIUS_OPTIONS.map((opt) => (
              <option key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Priority Filter */}
      <FilterPill
        label="ความสำคัญ"
        icon="⚡"
        value={priorityFilter}
        onChange={onPriorityFilterChange}
        options={[
          { value: "all", label: "ทั้งหมด" },
          { value: "high", label: "สูง (>70)" },
          { value: "medium", label: "ปานกลาง" },
          { value: "low", label: "ต่ำ (<40)" },
        ]}
      />

      {/* Product Filter */}
      <FilterPill
        label="ผลิตภัณฑ์"
        icon="🏷️"
        value={productFilter}
        onChange={onProductFilterChange}
        options={[
          { value: "all", label: "ทั้งหมด" },
          { value: "Motor", label: "Motor" },
          { value: "Health", label: "Health" },
          { value: "Savings", label: "Savings" },
          { value: "Protection", label: "Protection" },
          { value: "AUM", label: "AUM / Pension" },
          { value: "Loan", label: "Loan" },
        ]}
      />

      {/* KYC Filter */}
      <FilterPill
        label="สถานะ KYC"
        icon="🛡️"
        value={kycFilter}
        onChange={onKycFilterChange}
        options={[
          { value: "all", label: "ทั้งหมด" },
          { value: "verified", label: "KYC แล้ว" },
          { value: "pending", label: "ยังไม่ยืนยัน" },
        ]}
      />

      {/* Reset Button — shown when filters are active */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => {
            onPriorityFilterChange("all");
            onProductFilterChange("all");
            onKycFilterChange("all");
            onRadiusChange(10);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            backgroundColor: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: "10px",
            padding: "6px 12px",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#DC2626",
            cursor: "pointer",
            transition: "all 0.15s ease",
            flexShrink: 0,
          }}
          title="รีเซ็ตตัวกรองทั้งหมด"
        >
          <span>✕</span>
          <span>รีเซ็ต</span>
        </button>
      )}

      {/* Spacer + Count indicator */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
        {hasActiveFilters && (
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              backgroundColor: "#FAF7F6",
              color: "#5a4544",
              border: "1px solid #E2DAD9",
              padding: "2px 8px",
              borderRadius: "20px",
            }}
          >
            มีตัวกรองใช้งาน
          </span>
        )}
      </div>
    </div>
  );
}
