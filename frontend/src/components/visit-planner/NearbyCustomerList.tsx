"use client";
import React from "react";
import type { CandidateCustomerOut } from "@/types";

interface NearbyCustomerListProps {
  customers: CandidateCustomerOut[];
  selectedCustomerId: string | null;
  onSelectCustomer: (customer: CandidateCustomerOut) => void;
  sortBy: "priority" | "distance" | "name";
  onSortByChange: (sort: "priority" | "distance" | "name") => void;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  excludedMissingCount?: number;
  radiusKm?: number | null;
  onIncreaseRadius?: () => void;
  navActive?: boolean;
}

const AVATAR_COLORS = [
  { bg: "#EDE9FE", text: "#6D28D9", ring: "#C4B5FD" },
  { bg: "#E0F2FE", text: "#0369A1", ring: "#7DD3FC" },
  { bg: "#CCFBF1", text: "#0F766E", ring: "#5EEAD4" },
  { bg: "#FEF3C7", text: "#B45309", ring: "#FCD34D" },
  { bg: "#FCE7F3", text: "#BE185D", ring: "#F9A8D4" },
  { bg: "#DCFCE7", text: "#15803D", ring: "#86EFAC" },
  { bg: "#F3E8FF", text: "#7E22CE", ring: "#D8B4FE" },
];

function ScoreRing({ score, size = 40 }: { score: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;
  const color =
    score >= 85 ? "#DC2626" : score >= 70 ? "#EA580C" : score >= 50 ? "#D97706" : "#16A34A";
  const trackColor = score >= 85 ? "#FEE2E2" : score >= 70 ? "#FED7AA" : score >= 50 ? "#FEF3C7" : "#DCFCE7";

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={5}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={5}
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
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.75rem",
          fontWeight: 800,
          color,
        }}
      >
        {score}
      </div>
    </div>
  );
}

function getPriorityBadge(level?: string | null, score?: number | null) {
  const s = score ?? 50;
  if (level === "high" || s >= 75) return { label: "สูง", bg: "#FEF2F2", color: "#DC2626", dot: "#DC2626" };
  if (level === "medium" || s >= 50) return { label: "ปานกลาง", bg: "#FFF7ED", color: "#EA580C", dot: "#EA580C" };
  return { label: "ต่ำ", bg: "#F0FDF4", color: "#16A34A", dot: "#16A34A" };
}

const PRODUCT_STYLES: Record<string, { bg: string; color: string }> = {
  Motor: { bg: "#FAF7F6", color: "#5a4544" },
  Health: { bg: "#F0FDF4", color: "#16A34A" },
  Savings: { bg: "#F0FDFA", color: "#0D9488" },
  Protection: { bg: "#FFF7ED", color: "#EA580C" },
  AUM: { bg: "#FAF5FF", color: "#9333EA" },
  Pension: { bg: "#FAF5FF", color: "#9333EA" },
  Loan: { bg: "#F8FAFC", color: "#475569" },
};

function getProductStyle(tag: string) {
  const key = Object.keys(PRODUCT_STYLES).find((k) => tag.includes(k));
  return key ? PRODUCT_STYLES[key] : { bg: "#F1F5F9", color: "#475569" };
}

export function NearbyCustomerList({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  sortBy,
  onSortByChange,
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  loading = false,
  excludedMissingCount = 0,
  radiusKm = 10,
  onIncreaseRadius,
  navActive = false,
}: NearbyCustomerListProps) {
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
      {/* Header */}
      <div
        style={{
          padding: "14px 18px 12px",
          borderBottom: "1px solid #F1F5F9",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          background: "linear-gradient(135deg, #FAFBFF 0%, #ffffff 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "8px",
              backgroundColor: "#FAF7F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.9rem",
            }}
          >
            👥
          </div>
          <div>
            <h2
              style={{
                fontSize: "0.9375rem",
                fontWeight: 800,
                color: "#0F172A",
                margin: 0,
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              รายชื่อลูกค้าใกล้คุณ
            </h2>
            <div style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 500 }}>
              {totalCount} รายการ • เลือกเพื่อดูรายละเอียด
            </div>
          </div>
        </div>

        {/* Sort Selector */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            padding: "4px 10px",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600, whiteSpace: "nowrap" }}>
            เรียงตาม
          </span>
          <select
            aria-label="เรียงลำดับลูกค้า"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as "priority" | "distance" | "name")}
            style={{
              border: "none",
              backgroundColor: "transparent",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#334155",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="priority">คะแนน ↓</option>
            <option value="distance">ระยะทาง ↑</option>
            <option value="name">ชื่อ A-Z</option>
          </select>
        </div>
      </div>

      {/* Partial-data warning: customers excluded due to missing coordinates */}
      {excludedMissingCount > 0 && !loading && (
        <div
          style={{
            margin: "0 10px 0 10px",
            backgroundColor: "#FFFBEB",
            border: "1px solid #FCD34D",
            borderLeft: "3px solid #D97706",
            borderRadius: "8px",
            padding: "7px 11px",
            display: "flex",
            alignItems: "center",
            gap: "7px",
          }}
        >
          <span style={{ fontSize: "0.875rem", flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#92400E" }}>
              ข้อมูลตำแหน่งไม่ครบ
            </div>
            <div style={{ fontSize: "0.75rem", color: "#B45309" }}>
              {excludedMissingCount} ราย ไม่มีพิกัดที่อยู่ — ไม่รวมในรายการนี้
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Customer List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          maxHeight: "700px",
        }}
      >
        {loading ? (
          /* Skeleton loading state */
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                borderRadius: "12px",
                border: "1px solid #F1F5F9",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                animation: "pulse 1.5s ease-in-out infinite",
                opacity: 0.6,
              }}
            >
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#F1F5F9" }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: "12px", backgroundColor: "#F1F5F9", borderRadius: "6px", width: "60%", marginBottom: "6px" }} />
                <div style={{ height: "10px", backgroundColor: "#F8FAFC", borderRadius: "6px", width: "40%" }} />
              </div>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#F1F5F9" }} />
            </div>
          ))
        ) : customers.length === 0 ? (
          <div
            style={{
              padding: "40px 16px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div style={{ fontSize: "2.25rem" }}>🔍</div>
            <div style={{ fontSize: "0.9375rem", fontWeight: 800, color: "#1E293B" }}>
              ไม่พบลูกค้าใกล้เคียง
            </div>
            <div style={{ fontSize: "0.8125rem", color: "#64748B", maxWidth: "240px", lineHeight: 1.5 }}>
              ยังไม่พบลูกค้าที่อยู่ภายในรัศมี 
              <strong style={{ color: "#5a4544" }}>{radiusKm !== null && radiusKm !== undefined ? `${radiusKm} กม.` : "10 กม."}</strong>
               จากตำแหน่งของคุณ
            </div>
            {onIncreaseRadius && (
              <button
                type="button"
                onClick={onIncreaseRadius}
                style={{
                  marginTop: "4px",
                  background: "linear-gradient(135deg, #4a3837 0%, #5a4544 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 18px",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(90,69,68,0.3)",
                }}
              >
                + เพิ่มรัศมีการค้นหา
              </button>
            )}
          </div>
        ) : (
          customers.map((c, idx) => {
            const isSelected = selectedCustomerId === c.customer_id;
            const avatar = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            const score = c.priority_score ?? 50;
            const initial = c.customer_name.trim().charAt(0) || "ล";
            const priority = getPriorityBadge(c.priority_level, score);
            const tags =
              c.product_tags && c.product_tags.length > 0
                ? c.product_tags
                : c.why_now?.includes("รถ")
                ? ["Motor", "Health"]
                : ["Health", "Savings"];

            return (
              <div
                key={c.customer_id}
                onClick={() => onSelectCustomer(c)}
                style={{
                  backgroundColor: isSelected
                    ? navActive
                      ? "#FAF7F6"
                      : "#F5F3FF"
                    : "#ffffff",
                  borderRadius: "12px",
                  border: isSelected
                    ? navActive
                      ? "2px solid #5a4544"
                      : "2px solid #8B5CF6"
                    : "1px solid #F1F5F9",
                  padding: "11px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected
                    ? navActive
                      ? "0 2px 12px rgba(90,69,68,0.2)"
                      : "0 2px 12px rgba(139,92,246,0.15)"
                    : "0 1px 2px rgba(0,0,0,0.02)",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "#F8FAFC";
                    e.currentTarget.style.borderColor = "#CBD5E1";
                    e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.06)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                    e.currentTarget.style.borderColor = "#F1F5F9";
                    e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)";
                  }
                }}
              >
                {/* Left accent bar (for selected) */}
                {isSelected && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "16%",
                      bottom: "16%",
                      width: "3px",
                      backgroundColor: navActive ? "#5a4544" : "#8B5CF6",
                      borderRadius: "0 2px 2px 0",
                    }}
                  />
                )}

                {/* Top row: Avatar + Info + Score */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {/* Avatar */}
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      backgroundColor: avatar.bg,
                      color: avatar.text,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.0625rem",
                      fontWeight: 800,
                      flexShrink: 0,
                      border: `2px solid ${isSelected ? avatar.ring : "transparent"}`,
                    }}
                  >
                    {initial}
                  </div>

                  {/* Main Info */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    {/* Name + Priority */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                      <div
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 700,
                          color: "#0F172A",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "130px",
                        }}
                      >
                        {c.customer_name}
                      </div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          backgroundColor: priority.bg,
                          color: priority.color,
                          padding: "1px 5px",
                          borderRadius: "4px",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {priority.label}
                      </span>
                    </div>

                    {/* Sub-line: Age • Distance */}
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748B",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        marginBottom: "4px",
                      }}
                    >
                      <span>{c.age ? `${c.age} ปี` : "30 ปี"}</span>
                      <span style={{ color: "#CBD5E1" }}>•</span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "2px",
                          color: "#5a4544",
                          fontWeight: 600,
                        }}
                      >
                        <span>📍</span>
                        <span>{c.distance_km ? `${c.distance_km} กม.` : "2.5 กม."}</span>
                      </span>
                    </div>

                    {/* Product Tags */}
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {tags.slice(0, 2).map((t, ti) => {
                        const cleanTag = t.split(" ")[0];
                        const style = getProductStyle(cleanTag);
                        return (
                          <span
                            key={ti}
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              padding: "1px 6px",
                              borderRadius: "4px",
                              backgroundColor: style.bg,
                              color: style.color,
                            }}
                          >
                            {cleanTag}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Score Ring */}
                  <ScoreRing score={score} size={40} />
                </div>

                {/* Bottom Row: Explicit Broker Action Button ("เลือกไปหาลูกค้ารายนี้") */}
                <div
                  style={{
                    paddingTop: "7px",
                    borderTop: "1px solid #F1F5F9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontFamily: "var(--font-reading-thai)",
                      color: "#64748B",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "150px",
                    }}
                    title={c.why_now || undefined}
                  >
                    {c.why_now ? `💡 ${c.why_now}` : "ลูกค้าแนะนำโดย AI"}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCustomer(c);
                    }}
                    style={{
                      backgroundColor: isSelected
                        ? navActive
                          ? "#5a4544"
                          : "#8B5CF6"
                        : "#FAF7F6",
                      color: isSelected ? "#ffffff" : "#5a4544",
                      border: isSelected ? "none" : "1px solid #E2DAD9",
                      borderRadius: "6px",
                      padding: "4px 10px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>
                      {isSelected
                        ? navActive
                          ? "🚀 กำลังนำทาง"
                          : "✓ เลือกอยู่"
                        : "🎯 เลือกไปหาลูกค้ารายนี้"}
                    </span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      <div
        style={{
          padding: "10px 18px",
          borderTop: "1px solid #F1F5F9",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "0.75rem",
          color: "#64748B",
          backgroundColor: "#FAFBFC",
        }}
      >
        <div>
          แสดง {Math.min((currentPage - 1) * 10 + 1, totalCount)}–{Math.min(currentPage * 10, totalCount)} จาก{" "}
          <strong style={{ color: "#0F172A" }}>{totalCount}</strong> ราย
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            style={{
              border: "1px solid #E2E8F0",
              backgroundColor: currentPage <= 1 ? "#F8FAFC" : "#ffffff",
              borderRadius: "6px",
              width: "26px",
              height: "26px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: currentPage <= 1 ? "not-allowed" : "pointer",
              color: currentPage <= 1 ? "#CBD5E1" : "#475569",
              fontSize: "0.875rem",
            }}
          >
            ‹
          </button>

          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              style={{
                border: p === currentPage ? "none" : "1px solid #E2E8F0",
                backgroundColor: p === currentPage ? "#5a4544" : "#ffffff",
                color: p === currentPage ? "#ffffff" : "#475569",
                borderRadius: "6px",
                width: "26px",
                height: "26px",
                fontSize: "0.75rem",
                fontWeight: p === currentPage ? 700 : 500,
                cursor: "pointer",
              }}
            >
              {p}
            </button>
          ))}

          {totalPages > 5 && (
            <>
              <span style={{ padding: "0 2px", color: "#CBD5E1" }}>…</span>
              <button
                type="button"
                onClick={() => onPageChange(totalPages)}
                style={{
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#ffffff",
                  color: "#475569",
                  borderRadius: "6px",
                  padding: "0 8px",
                  height: "26px",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            style={{
              border: "1px solid #E2E8F0",
              backgroundColor: currentPage >= totalPages ? "#F8FAFC" : "#ffffff",
              borderRadius: "6px",
              width: "26px",
              height: "26px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
              color: currentPage >= totalPages ? "#CBD5E1" : "#475569",
              fontSize: "0.875rem",
            }}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
