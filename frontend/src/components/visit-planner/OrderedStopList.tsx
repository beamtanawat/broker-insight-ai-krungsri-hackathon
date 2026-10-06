"use client";
import React from "react";
import Link from "next/link";
import type { PlannedVisitStop } from "@/types";
import { Badge, Button } from "@/components/ui";

interface OrderedStopListProps {
  visits: PlannedVisitStop[];
  selectedIndex?: number | null;
  onSelectVisit?: (index: number) => void;
}

export function OrderedStopList({
  visits,
  selectedIndex = null,
  onSelectVisit,
}: OrderedStopListProps) {
  if (visits.length === 0) {
    return (
      <div
        style={{
          padding: "30px 20px",
          textAlign: "center",
          backgroundColor: "var(--slate-50)",
          borderRadius: "var(--radius-md)",
          border: "1px dashed var(--border-subtle)",
          color: "var(--slate-500)",
        }}
      >
        ไม่มีรายการลูกค้าในเส้นทางที่เลือก
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {visits.map((visit, idx) => {
        const isSelected = selectedIndex === idx;
        const cust = visit.customer;
        const loc = visit.location;

        return (
          <div
            key={cust.customer_id || idx}
            onClick={() => onSelectVisit && onSelectVisit(idx)}
            style={{
              padding: "14px 16px",
              borderRadius: "var(--radius-md)",
              backgroundColor: isSelected ? "var(--primary-50)" : "var(--white)",
              border: isSelected
                ? "2px solid var(--primary-600)"
                : "1px solid var(--border-subtle)",
              boxShadow: isSelected ? "var(--shadow-md)" : "var(--shadow-xs)",
              transition: "all var(--transition-fast)",
              cursor: "pointer",
            }}
          >
            {/* Top row: Sequence Badge, Customer Name, Ref, Priority */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                marginBottom: "8px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {/* Stop Number Circle */}
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: "var(--krungsri-navy)",
                    color: "var(--krungsri-yellow)",
                    fontWeight: 800,
                    fontSize: "0.875rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 8px rgba(11, 30, 54, 0.2)",
                  }}
                >
                  {visit.visit_order}
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--krungsri-navy)" }}>
                      {cust.customer_name}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--slate-500)", fontFamily: "monospace" }}>
                      {cust.external_ref}
                    </span>
                    {cust.relationship_tier && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          padding: "1px 6px",
                          borderRadius: "var(--radius-full)",
                          backgroundColor: "var(--slate-100)",
                          color: "var(--slate-700)",
                          fontWeight: 600,
                        }}
                      >
                        {cust.relationship_tier}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Priority Badge & Score */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {visit.priority_score !== null && visit.priority_score !== undefined && (
                  <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--krungsri-navy)" }}>
                    AI Score: {visit.priority_score}
                  </span>
                )}
                <Badge
                  variant={
                    visit.priority_level === "high"
                      ? "danger"
                      : visit.priority_level === "medium"
                      ? "warning"
                      : "success"
                  }
                  size="sm"
                >
                  {visit.priority_level === "high"
                    ? "เร่งด่วนสูง"
                    : visit.priority_level === "medium"
                    ? "ปานกลาง"
                    : "ทั่วไป"}
                </Badge>
              </div>
            </div>

            {/* Travel Segment Info from previous stop */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "3px 8px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--slate-100)",
                fontSize: "0.75rem",
                color: "var(--slate-700)",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              <span>🚗 เดินทางจากจุดก่อนหน้า:</span>
              <span style={{ color: "var(--primary-700)" }}>
                {visit.transit_time_from_prev_minutes.toFixed(0)} นาที
              </span>
              <span>•</span>
              <span>{visit.distance_from_prev_km.toFixed(1)} กม.</span>
            </div>

            {/* Why Now Urgency Box */}
            {visit.why_now && (
              <div
                style={{
                  fontSize: "0.8125rem",
                  color: "#854d0e",
                  backgroundColor: "#fefce8",
                  padding: "6px 10px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid #fef08a",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "baseline",
                  gap: "6px",
                  fontFamily: "var(--font-reading-thai)",
                }}
              >
                <span style={{ fontWeight: 700, flexShrink: 0, fontFamily: "var(--font-ui-thai)" }}>⚡ Why Now:</span>
                <span style={{ lineHeight: "var(--lh-reading, 1.7)" }}>{visit.why_now}</span>
              </div>
            )}

            {/* Recommended Action / Insight */}
            {visit.recommended_next_action && (
              <div
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--slate-700)",
                  backgroundColor: "var(--slate-50)",
                  padding: "6px 10px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--slate-200)",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "baseline",
                  gap: "6px",
                  fontFamily: "var(--font-reading-thai)",
                }}
              >
                <span style={{ fontWeight: 600, color: "var(--krungsri-navy)", flexShrink: 0, fontFamily: "var(--font-ui-thai)" }}>
                  💡 สิ่งที่ควรนำเสนอ:
                </span>
                <span style={{ lineHeight: "var(--lh-reading, 1.7)" }}>{visit.recommended_next_action}</span>
              </div>
            )}

            {/* Stop Location Address */}
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--slate-500)",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                marginBottom: "8px",
              }}
            >
              <span>📍</span>
              <span>
                {loc.address || `${loc.district ? `เขต${loc.district}, ` : ""}${loc.province || "กรุงเทพมหานคร"}`}
              </span>
            </div>

            {/* Deterministic Explanation for this stop */}
            {visit.explanation && (
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--slate-600)",
                  fontStyle: "italic",
                  lineHeight: 1.35,
                  padding: "4px 8px",
                  backgroundColor: "rgba(37, 99, 235, 0.05)",
                  borderRadius: "var(--radius-sm)",
                  borderLeft: "3px solid var(--primary-500)",
                  marginBottom: "8px",
                }}
              >
                {visit.explanation}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "6px" }}>
              <Link href={`/customers/${cust.customer_id}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" style={{ fontSize: "0.75rem", padding: "3px 8px" }}>
                  ดูข้อมูลลูกค้า ↗
                </Button>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
