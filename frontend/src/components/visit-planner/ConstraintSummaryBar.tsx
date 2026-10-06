"use client";
import React from "react";
import type { VisitPlannerConfigResponse, LocationPoint } from "@/types";
import { Card, Badge, Tooltip } from "@/components/ui";

interface ConstraintSummaryBarProps {
  config: VisitPlannerConfigResponse | null;
  loading?: boolean;
}

export function ConstraintSummaryBar({ config, loading = false }: ConstraintSummaryBarProps) {
  if (loading || !config) {
    return (
      <Card style={{ marginBottom: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ width: "80px", height: "12px", backgroundColor: "var(--slate-200)", borderRadius: "4px" }} />
              <div style={{ width: "130px", height: "18px", backgroundColor: "var(--slate-100)", borderRadius: "4px" }} />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const formatLocation = (loc: LocationPoint) => {
    if (loc.name) {
      // Shorten long office names for compact display
      return loc.name.replace("ธนาคารกรุงศรีอยุธยา ", "");
    }
    return loc.address || `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`;
  };

  return (
    <Card
      style={{
        marginBottom: "20px",
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", borderBottom: "1px solid var(--slate-100)", paddingBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.1rem" }}>⚙️</span>
          <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--krungsri-navy)" }}>
            ข้อกำหนดและเงื่อนไขการเดินทาง (Route Constraints)
          </span>
        </div>
        <Badge variant="neutral" size="sm">
          ระบบควบคุมแบบ Hard Constraints
        </Badge>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "14px",
        }}
      >
        {/* 1. Office Hours */}
        <div
          style={{
            padding: "10px 12px",
            backgroundColor: "var(--white)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--slate-200)",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>⏰</span>
            <span>เวลาทำการ (Office Hours)</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--krungsri-navy)" }}>
            {config.office_start_time} – {config.office_end_time} น.
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--slate-400)", marginTop: "2px" }}>
            ออกจากสำนักงานและกลับก่อนปิดทำการ
          </div>
        </div>

        {/* 2. Max Daily Travel Time */}
        <div
          style={{
            padding: "10px 12px",
            backgroundColor: "var(--white)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--slate-200)",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>⏱️</span>
            <span>เวลาเดินทางสูงสุด (Max Travel)</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--krungsri-navy)" }}>
            {config.max_daily_travel_time_minutes} นาที{" "}
            <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--slate-500)" }}>
              ({(config.max_daily_travel_time_minutes / 60).toFixed(1)} ชม.)
            </span>
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--slate-400)", marginTop: "2px" }}>
            เวลาอยู่บนถนนตลอดทั้งวัน
          </div>
        </div>

        {/* 3. Max Daily Distance */}
        <div
          style={{
            padding: "10px 12px",
            backgroundColor: "var(--white)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--slate-200)",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🚗</span>
            <span>ระยะทางสูงสุด (Max Distance)</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--krungsri-navy)" }}>
            {config.max_daily_distance_km.toFixed(1)} กม.
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--slate-400)", marginTop: "2px" }}>
            ระยะทางขับขี่ไป-กลับรวมทั้งหมด
          </div>
        </div>

        {/* 4. Start Location */}
        <div
          style={{
            padding: "10px 12px",
            backgroundColor: "var(--white)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--slate-200)",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🏢</span>
            <span>จุดเริ่มต้น (Start Location)</span>
          </div>
          <Tooltip content={config.start_location.address || config.start_location.name || ""}>
            <div
              style={{
                fontWeight: 700,
                fontSize: "0.85rem",
                color: "var(--krungsri-navy)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {formatLocation(config.start_location)}
            </div>
          </Tooltip>
          <div style={{ fontSize: "0.7rem", color: "var(--slate-400)", marginTop: "2px" }}>
            ออกจากสำนักงานประจำ
          </div>
        </div>

        {/* 5. End Location */}
        <div
          style={{
            padding: "10px 12px",
            backgroundColor: "var(--white)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--slate-200)",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🏁</span>
            <span>จุดสิ้นสุด (End Location)</span>
          </div>
          <Tooltip content={config.end_location.address || config.end_location.name || ""}>
            <div
              style={{
                fontWeight: 700,
                fontSize: "0.85rem",
                color: "var(--krungsri-navy)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {formatLocation(config.end_location)}
            </div>
          </Tooltip>
          <div style={{ fontSize: "0.7rem", color: "var(--slate-400)", marginTop: "2px" }}>
            เดินทางกลับสู่สำนักงานประจำ
          </div>
        </div>
      </div>
    </Card>
  );
}
