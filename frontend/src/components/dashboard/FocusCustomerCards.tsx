"use client";
import React from "react";
import Link from "next/link";
import type { CustomerListItem } from "@/types";

interface FocusCustomerItem {
  id: string;
  name: string;
  ref: string;
  initial: string;
  avatarBg: string;
  priorityScore: number;
  priorityLevel: "high" | "medium" | "low";
  priorityLabel: "สูง" | "กลาง" | "ต่ำ";
  icon: string;
  reason: string;
}

const DEFAULT_FOCUS_CUSTOMERS: FocusCustomerItem[] = [
  {
    id: "c0c0f992-b06d-4b9f-bbc6-9b4458a79491",
    name: "ณัฐชา 'เพิร์ล' ประเสริฐกิจการ",
    ref: "KS-00002",
    initial: "ณ",
    avatarBg: "#F59E0B", // Amber
    priorityScore: 94,
    priorityLevel: "high",
    priorityLabel: "สูง",
    icon: "🚗",
    reason: "กรมธรรม์รถยนต์ใกล้ครบกำหนดภายใน 21 วัน",
  },
  {
    id: "d82e838c-63fb-47a3-9428-f15dc4d68883",
    name: "ณัฐพร วาริน",
    ref: "KS-00001",
    initial: "ณ",
    avatarBg: "#5a4544", // Brown
    priorityScore: 88,
    priorityLevel: "high",
    priorityLabel: "สูง",
    icon: "❤️",
    reason: "ประกันสุขภาพใกล้ครบกำหนดใน 14 วัน",
  },
  {
    id: "c0a451ce-a2b5-406e-9358-4a2af87721ca",
    name: "วิภา ชัยโย",
    ref: "KS-00004",
    initial: "ว",
    avatarBg: "#7C3AED", // Purple
    priorityScore: 76,
    priorityLevel: "medium",
    priorityLabel: "กลาง",
    icon: "🏠",
    reason: "มีสินเชื่อบ้าน 5.5 ล้านบาท ไร้ประกันคุ้มครองวงเงิน",
  },
  {
    id: "f535562e-8f70-4711-bbd0-7e092606cdd7",
    name: "ธนภูมิ อิ่มเปี่ยม",
    ref: "KS-00005",
    initial: "ธ",
    avatarBg: "#10B981", // Green
    priorityScore: 65,
    priorityLevel: "medium",
    priorityLabel: "กลาง",
    icon: "📈",
    reason: "งานแผนบำนาญ AUM สูง ควรติดตามต่อเนื่อง",
  },
];

interface FocusCustomerCardsProps {
  customers?: CustomerListItem[];
}

export function FocusCustomerCards({ customers }: FocusCustomerCardsProps) {
  // If backend customers are available, blend them with showcase details
  const displayItems = React.useMemo(() => {
    if (!customers || customers.length === 0) return DEFAULT_FOCUS_CUSTOMERS;

    // Try finding the showcase ones from real customer data
    const matched = DEFAULT_FOCUS_CUSTOMERS.map((showcase) => {
      const found = customers.find(
        (c) => c.external_ref === showcase.ref || c.id === showcase.id
      );
      if (found) {
        return {
          ...showcase,
          id: found.id,
          name: found.full_name,
          priorityScore: found.score_display ?? showcase.priorityScore,
          reason: found.score_short_reason || found.why_now || showcase.reason,
        };
      }
      return showcase;
    });

    return matched;
  }, [customers]);

  return (
    <div style={{ marginBottom: "24px" }}>
      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
        }}
      >
        <h2
          style={{
            fontSize: "1.0625rem",
            fontWeight: 800,
            color: "#0F172A",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          ลูกค้าที่ควรให้ความสนใจวันนี้
        </h2>
        <Link
          href="/customers"
          style={{
            fontSize: "0.8125rem",
            fontWeight: 700,
            color: "#5a4544",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span>ดูทั้งหมด</span>
          <span>›</span>
        </Link>
      </div>

      {/* 4 Customer Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "14px",
        }}
        className="focus-customers-grid"
      >
        {displayItems.map((item) => {
          const isHigh = item.priorityLevel === "high";

          return (
            <div
              key={item.ref}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.04)";
              }}
            >
              <div>
                {/* Header: Avatar + Name + ID */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "12px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      backgroundColor: item.avatarBg,
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "1.1rem",
                      flexShrink: 0,
                    }}
                  >
                    {item.initial}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 800,
                        color: "#0F172A",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        lineHeight: 1.25,
                      }}
                      title={item.name}
                    >
                      {item.name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "2px" }}>
                      {item.ref}
                    </div>
                  </div>
                </div>

                {/* Priority Badges Row */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "4px",
                      backgroundColor: isHigh ? "#FEF2F2" : "#FEF3C7",
                      color: isHigh ? "#DC2626" : "#D97706",
                      border: `1px solid ${isHigh ? "#FECACA" : "#FDE68A"}`,
                    }}
                  >
                    Priority {item.priorityScore}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "4px",
                      backgroundColor: isHigh ? "#FEF2F2" : "#FEF3C7",
                      color: isHigh ? "#DC2626" : "#D97706",
                    }}
                  >
                    {item.priorityLabel}
                  </span>
                </div>

                {/* Reason / Opportunity Box */}
                <div
                  style={{
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #F1F5F9",
                    borderRadius: "8px",
                    padding: "10px 10px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    minHeight: "56px",
                  }}
                >
                  <span style={{ fontSize: "1rem", flexShrink: 0, marginTop: "1px" }}>{item.icon}</span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontFamily: "var(--font-reading-thai)",
                      color: "#334155",
                      lineHeight: "var(--lh-reading, 1.7)",
                      fontWeight: 500,
                    }}
                  >
                    {item.reason}
                  </span>
                </div>
              </div>

              {/* Bottom Details Link */}
              <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px solid #F1F5F9" }}>
                <Link
                  href={`/customers/${item.id}`}
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#0F172A",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>ดูรายละเอียด</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
