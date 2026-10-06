"use client";
import React from "react";
import type { VisitPlanRouteResponse } from "@/types";
import { Button } from "@/components/ui";

interface RouteSummaryCardProps {
  route: VisitPlanRouteResponse | null;
  onRemoveCustomer?: (customerId: string) => void;
}

export function RouteSummaryCard({ route, onRemoveCustomer }: RouteSummaryCardProps) {
  if (!route) return null;

  const isFeasible = route.is_feasible;
  const limits = route.limits;
  const violated = route.violated_constraints || [];
  const deferrals = route.suggested_deferrals || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* KPI Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "12px",
        }}
      >
        {/* Feasibility Status */}
        <div
          style={{
            padding: "12px 14px",
            backgroundColor: isFeasible ? "var(--success-bg)" : "var(--danger-bg)",
            borderRadius: "var(--radius-md)",
            border: isFeasible ? "1px solid var(--success-border)" : "1px solid var(--danger-border)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: isFeasible ? "var(--success-text)" : "var(--danger-text)", fontWeight: 600 }}>
            สถานะความเป็นไปได้
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
            <span style={{ fontSize: "1.2rem" }}>{isFeasible ? "✅" : "⚠️"}</span>
            <span
              style={{
                fontWeight: 800,
                fontSize: "0.95rem",
                color: isFeasible ? "var(--success-text)" : "var(--danger-text)",
              }}
            >
              {isFeasible ? "ผ่านเกณฑ์ (Feasible)" : "เกินขีดจำกัด (Infeasible)"}
            </span>
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--slate-500)", marginTop: "4px" }}>
            {isFeasible ? "เป็นไปตามเงื่อนไขทุกข้อ" : `มี ${violated.length} เงื่อนไขที่เกินกำหนด`}
          </div>
        </div>

        {/* Total Distance */}
        <div
          style={{
            padding: "12px 14px",
            backgroundColor: "var(--white)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
            <span>🚗</span>
            <span>ระยะทางรวม</span>
          </div>
          <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--krungsri-navy)" }}>
            {route.total_distance_km.toFixed(1)}{" "}
            <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--slate-500)" }}>กม.</span>
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--slate-400)", marginTop: "4px" }}>
            ขีดจำกัด: {limits.max_distance_km.toFixed(1)} กม. ({limits.distance_utilization_pct.toFixed(0)}%)
          </div>
        </div>

        {/* Total Travel Time */}
        <div
          style={{
            padding: "12px 14px",
            backgroundColor: "var(--white)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
            <span>⏱️</span>
            <span>เวลาเดินทางรวม</span>
          </div>
          <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--krungsri-navy)" }}>
            {route.total_travel_time_minutes.toFixed(0)}{" "}
            <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--slate-500)" }}>นาที</span>
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--slate-400)", marginTop: "4px" }}>
            ขีดจำกัด: {limits.max_travel_time_minutes} นาที ({limits.travel_time_utilization_pct.toFixed(0)}%)
          </div>
        </div>

        {/* Customer Count */}
        <div
          style={{
            padding: "12px 14px",
            backgroundColor: "var(--white)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
            <span>👥</span>
            <span>จำนวนลูกค้าที่พบ</span>
          </div>
          <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--krungsri-navy)" }}>
            {route.total_customers_to_visit}{" "}
            <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--slate-500)" }}>ราย</span>
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--slate-400)", marginTop: "4px" }}>
            จุดแวะรวมทั้งหมด {route.total_stops} จุด
          </div>
        </div>
      </div>

      {/* Infeasible Warnings & Deferral Recommendations */}
      {!isFeasible && (
        <div
          style={{
            padding: "14px 16px",
            backgroundColor: "#fff1f2",
            borderRadius: "var(--radius-md)",
            border: "1px solid #fecdd3",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#9f1239", fontWeight: 700, marginBottom: "8px" }}>
            <span style={{ fontSize: "1.1rem" }}>🚨</span>
            <span>เส้นทางนี้เกินขีดจำกัดที่กำหนด (Infeasible Route)</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
            {violated.map((v, i) => (
              <div
                key={i}
                style={{
                  fontSize: "0.8125rem",
                  color: "#be123c",
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                  padding: "6px 10px",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>❌</span>
                <span>{v.message}</span>
              </div>
            ))}
          </div>

          {/* Suggested Deferrals */}
          {deferrals.length > 0 && (
            <div style={{ borderTop: "1px dashed #fecdd3", paddingTop: "10px" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9f1239", marginBottom: "6px" }}>
                💡 คำแนะนำจาก AI: เลื่อนการเข้าพบลูกค้าต่อไปนี้เพื่อปรับให้เส้นทางเป็นไปได้
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {deferrals.map((d) => (
                  <div
                    key={d.customer_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: "var(--white)",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid #fecdd3",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--krungsri-navy)" }}>
                        {d.customer_name} ({d.external_ref})
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--slate-500)" }}>
                        {d.reason} • ประหยัดเวลา ~{d.marginal_time_saved_minutes.toFixed(0)} นาที, ~{d.marginal_distance_saved_km.toFixed(1)} กม.
                      </div>
                    </div>
                    {onRemoveCustomer && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRemoveCustomer(d.customer_id)}
                        style={{ fontSize: "0.7rem", padding: "3px 8px", borderColor: "#f43f5e", color: "#e11d48" }}
                      >
                        นำออกเพื่อปรับสมดุล
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
