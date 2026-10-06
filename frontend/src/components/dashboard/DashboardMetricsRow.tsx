"use client";
import React from "react";
import Link from "next/link";

interface DashboardMetricsRowProps {
  highPriorityCount?: number;
  followupsCount?: number;
  pendingKycCount?: number;
  totalCustomersCount?: number;
  activePoliciesCount?: number;
}

export function DashboardMetricsRow({
  highPriorityCount = 42,
  followupsCount = 14,
  pendingKycCount = 28,
  totalCustomersCount = 248,
  activePoliciesCount = 382,
}: DashboardMetricsRowProps) {
  const cards = [
    {
      title: "ลูกค้าความสำคัญสูง",
      value: `${highPriorityCount} ราย`,
      trend: "↑ 12% จากสัปดาห์ที่แล้ว",
      trendColor: "#16A34A",
      icon: "👤",
      iconBg: "#FEE2E2",
      iconColor: "#EF4444",
      href: "/customers?priority=high",
    },
    {
      title: "นัดหมายติดตาม",
      value: `${followupsCount} รายการ`,
      trend: "↑ 27% จากสัปดาห์ที่แล้ว",
      trendColor: "#16A34A",
      icon: "📅",
      iconBg: "#F2ECEB",
      iconColor: "#5a4544",
      href: "/dashboard#tasks",
    },
    {
      title: "รอตรวจสอบ KYC",
      value: `${pendingKycCount} ราย`,
      trend: "↑ 8% จากสัปดาห์ที่แล้ว",
      trendColor: "#DC2626",
      icon: "📄",
      iconBg: "#FEF3C7",
      iconColor: "#D97706",
      href: "/customers?kyc=pending",
    },
    {
      title: "ลูกค้ารวมในพอร์ต",
      value: `${totalCustomersCount} ราย`,
      subtitle: `กรมธรรม์ Active ${activePoliciesCount} ฉบับ`,
      icon: "👥",
      iconBg: "#DCFCE7",
      iconColor: "#16A34A",
      href: "/customers",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: "16px",
        marginBottom: "24px",
      }}
      className="dashboard-metrics-grid"
    >
      {cards.map((card, idx) => (
        <Link
          key={idx}
          href={card.href}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              padding: "18px 20px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              cursor: "pointer",
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
            {/* Left Circle Icon */}
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: card.iconBg,
                color: card.iconColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.25rem",
                flexShrink: 0,
              }}
            >
              {card.icon}
            </div>

            {/* Middle Data */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.8125rem",
                  color: "#64748B",
                  fontWeight: 600,
                  marginBottom: "2px",
                }}
              >
                {card.title}
              </div>

              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "#0F172A",
                  lineHeight: 1.2,
                }}
              >
                {card.value}
              </div>

              {card.trend && (
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: card.trendColor,
                    marginTop: "2px",
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  {card.trend}
                </div>
              )}

              {card.subtitle && (
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748B",
                    marginTop: "2px",
                    fontWeight: 500,
                  }}
                >
                  {card.subtitle}
                </div>
              )}
            </div>

            {/* Right Chevron */}
            <div
              style={{
                color: "#94A3B8",
                fontSize: "1.1rem",
                fontWeight: 600,
                paddingLeft: "4px",
              }}
            >
              ›
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
