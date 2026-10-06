"use client";
import React from "react";
import type { VisitPlanRouteResponse } from "@/types";
import { Card, Badge } from "@/components/ui";

interface WhyThisRouteCardProps {
  route: VisitPlanRouteResponse | null;
}

export function WhyThisRouteCard({ route }: WhyThisRouteCardProps) {
  if (!route) return null;

  const optSummary = route.optimization_summary;
  const explanations = route.explanations || [];

  return (
    <Card
      style={{
        border: "1px solid var(--border-subtle)",
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Card Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
          borderBottom: "1px solid var(--slate-100)",
          paddingBottom: "10px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.2rem" }}>🧠</span>
          <div>
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--krungsri-navy)" }}>
              ทำไมระบบ AI จึงเลือกเส้นทางนี้? (Why This Route?)
            </h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "var(--slate-500)" }}>
              คำอธิบายความโปร่งใสของกระบวนการจัดลำดับการเข้าพบ (Transparent AI Decision Support)
            </p>
          </div>
        </div>
        <Badge variant="ai" size="sm">
          Explainable Route Engine
        </Badge>
      </div>

      {/* 4 Core Pillars Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        {/* 1. Customer Relevance */}
        <div
          style={{
            padding: "12px",
            backgroundColor: "var(--white)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--slate-200)",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
            <span style={{ fontSize: "1rem" }}>🎯</span>
            <span style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--krungsri-navy)" }}>
              ความสำคัญของลูกค้า (Relevance)
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--slate-600)", lineHeight: 1.4 }}>
            {optSummary?.priority_influence ||
              "จัดลำดับลูกค้าโดยให้น้ำหนักความสำคัญ (ML Priority Score) ควบคู่กับลำดับการเดินทาง"}
          </p>
        </div>

        {/* 2. Urgency & Why Now */}
        <div
          style={{
            padding: "12px",
            backgroundColor: "var(--white)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--slate-200)",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
            <span style={{ fontSize: "1rem" }}>⚡</span>
            <span style={{ fontWeight: 700, fontSize: "0.8125rem", color: "#854d0e" }}>
              ความเร่งด่วน (Why Now)
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--slate-600)", lineHeight: 1.4 }}>
            {optSummary?.urgency_influence ||
              "จัดกลุ่มลูกค้าที่มีจังหวะเวลาเร่งด่วน เช่น กรมธรรม์ใกล้ครบกำหนดอายุ ให้ได้รับการเข้าพบในวันนี้"}
          </p>
        </div>

        {/* 3. Geographic Efficiency */}
        <div
          style={{
            padding: "12px",
            backgroundColor: "var(--white)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--slate-200)",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
            <span style={{ fontSize: "1rem" }}>🗺️</span>
            <span style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--primary-700)" }}>
              ประสิทธิภาพเส้นทาง (Efficiency)
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--slate-600)", lineHeight: 1.4 }}>
            {optSummary?.efficiency_influence ||
              "จัดเส้นทางแบบวงรอบต่อเนื่อง (Loop Route) เชื่อมต่อจุดที่ใกล้เคียงกันเพื่อลดการเดินทางย้อนกลับ"}
          </p>
        </div>

        {/* 4. Constraint Compliance */}
        <div
          style={{
            padding: "12px",
            backgroundColor: "var(--white)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--slate-200)",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
            <span style={{ fontSize: "1rem" }}>🛡️</span>
            <span style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--success-text)" }}>
              ความสอดคล้องข้อกำหนด (Compliance)
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--slate-600)", lineHeight: 1.4 }}>
            {route.is_feasible
              ? `เดินทาง ${route.total_distance_km.toFixed(1)} กม. / ใช้เวลาเดินทาง ${route.total_travel_time_minutes.toFixed(0)} นาที อยู่ในกรอบเวลาทำการสำนักงาน`
              : "ตรวจพบข้อกำหนดที่เกินขีดจำกัด กรุณาปรับเปลี่ยนรายชื่อลูกค้าตามคำแนะนำ"}
          </p>
        </div>
      </div>

      {/* Step-by-Step Deterministic Explanations */}
      {explanations.length > 0 && (
        <div
          style={{
            padding: "12px 14px",
            backgroundColor: "var(--white)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--slate-200)",
          }}
        >
          <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--krungsri-navy)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>📝</span>
            <span>เหตุผลการจัดเส้นทางทีละลำดับ (Step-by-Step Route Rationale)</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {explanations.map((exp, idx) => (
              <li key={idx} style={{ fontSize: "0.75rem", color: "var(--slate-700)", lineHeight: 1.4 }}>
                {exp}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
