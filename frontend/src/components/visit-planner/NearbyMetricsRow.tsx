"use client";
import React from "react";
import type { NearbyKPIStats } from "@/lib/nearbyMockData";

interface NearbyMetricsRowProps {
  stats: NearbyKPIStats;
  radiusKm?: number | null;
  locationTimestamp?: Date | null;
}

const METRICS_CONFIG = [
  {
    key: "totalNearby",
    title: (radius: number) => `ในรัศมี ${radius} กม.`,
    icon: "👥",
    iconBg: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
    iconColor: "#2563EB",
    accent: "#2563EB",
    suffix: "ราย",
    trend: "+8%",
    trendUp: true,
  },
  {
    key: "highPriorityCount",
    title: () => "ความสำคัญสูง",
    icon: "🔥",
    iconBg: "linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)",
    iconColor: "#DC2626",
    accent: "#DC2626",
    suffix: "ราย",
    trend: "+3",
    trendUp: true,
  },
  {
    key: "followUpWithin7DaysCount",
    title: () => "ติดตามใน 7 วัน",
    icon: "⏰",
    iconBg: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
    iconColor: "#D97706",
    accent: "#D97706",
    suffix: "ราย",
    trend: "เร่งด่วน",
    trendUp: false,
  },
  {
    key: "kycCount",
    title: () => "KYC แล้ว",
    icon: "✅",
    iconBg: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
    iconColor: "#16A34A",
    accent: "#16A34A",
    suffix: "ราย",
    trend: "+12%",
    trendUp: true,
  },
  {
    key: "recommendationOpportunityCount",
    title: () => "โอกาสแนะนำ",
    icon: "💎",
    iconBg: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)",
    iconColor: "#7C3AED",
    accent: "#7C3AED",
    suffix: "ราย",
    trend: "ใหม่",
    trendUp: true,
  },
];

export function NearbyMetricsRow({ stats, radiusKm = 10 }: NearbyMetricsRowProps) {
  const radius = radiusKm || 10;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "12px",
        marginBottom: "18px",
      }}
      className="nearby-metrics-grid"
    >
      {METRICS_CONFIG.map((cfg, i) => {
        const value = stats[cfg.key as keyof NearbyKPIStats] as number;
        const title = cfg.title(radius);

        return (
          <div
            key={i}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "16px 18px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              cursor: "default",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 6px 20px rgba(0,0,0,0.08)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)";
            }}
          >
            {/* Accent top border */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                backgroundColor: cfg.accent,
                borderRadius: "16px 16px 0 0",
                opacity: 0.7,
              }}
            />

            {/* Icon + Trend row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: cfg.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.125rem",
                }}
              >
                {cfg.icon}
              </div>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: cfg.trendUp ? "#16A34A" : "#D97706",
                  backgroundColor: cfg.trendUp ? "#F0FDF4" : "#FFFBEB",
                  padding: "2px 7px",
                  borderRadius: "20px",
                  border: `1px solid ${cfg.trendUp ? "#BBF7D0" : "#FDE68A"}`,
                }}
              >
                {cfg.trend}
              </span>
            </div>

            {/* Value + Label */}
            <div>
              <div
                style={{
                  fontSize: "1.625rem",
                  fontWeight: 900,
                  color: "#0F172A",
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  marginBottom: "3px",
                  display: "flex",
                  alignItems: "baseline",
                  gap: "4px",
                }}
              >
                <span>{value}</span>
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#94A3B8" }}>
                  {cfg.suffix}
                </span>
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#64748B",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {title}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
