"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { User } from "@/types";
import { AppShell } from "@/components/layout";
import { SmartphoneMockup } from "@/components/domain/SmartphoneMockup";

// ─── Types ───────────────────────────────────────────────────────────────────

type MobileTab = "dashboard" | "customers" | "map" | "reports" | "more";

interface TaskItem {
  id: string;
  time: string;
  icon: string;
  title: string;
  subtitle: string;
  customerName: string;
  customerId: string;
  status: "pending" | "in_progress" | "scheduled" | "completed";
  completed: boolean;
}

// ─── Initial Mock Data matching Reference Images ────────────────────────────

const INITIAL_TASKS: TaskItem[] = [
  {
    id: "task-1",
    time: "09:00",
    icon: "📞",
    title: "โทรติดตาม",
    subtitle: "เรื่องต่ออายุกรมธรรม์รถยนต์",
    customerName: "ณัฐชา 'เฟิร์ส' ประเสริฐกิจการ",
    customerId: "KS-00002",
    status: "pending",
    completed: false,
  },
  {
    id: "task-2",
    time: "10:30",
    icon: "📄",
    title: "ตรวจเอกสาร KYC",
    subtitle: "ตรวจสอบเอกสาร KYC เพิ่มเติม",
    customerName: "ณัฐพร วาริน",
    customerId: "KS-00001",
    status: "pending",
    completed: false,
  },
  {
    id: "task-3",
    time: "13:00",
    icon: "👥",
    title: "นัดพบ",
    subtitle: "เพื่อเสนอแผนคุ้มครอง",
    customerName: "วิภา ชัยโย",
    customerId: "KS-00004",
    status: "scheduled",
    completed: false,
  },
  {
    id: "task-4",
    time: "15:30",
    icon: "📊",
    title: "ติดตามแผนบำนาญ",
    subtitle: "อัปเดตแผนการลงทุน",
    customerName: "ธนภูมิ อิ่มเปี่ยม",
    customerId: "KS-00005",
    status: "in_progress",
    completed: false,
  },
];

const ATTENTION_CUSTOMERS = [
  {
    id: "c0c0f992-b06d-4b9f-bbc6-9b4458a79491",
    name: "ณัฐชา 'เฟิร์ส' ประเสริฐกิจการ",
    ref: "KS-00002",
    avatarBg: "#FEF08A",
    avatarColor: "#854D0E",
    avatarChar: "ณ",
    score: 94,
    priorityLevel: "สูง",
    triggerIcon: "🚗",
    triggerText: "กรมธรรม์รถยนต์ใกล้ครบกำหนดภายใน 21 วัน",
  },
  {
    id: "d82e838c-63fb-47a3-9428-f15dc4d68883",
    name: "ณัฐพร วาริน",
    ref: "KS-00001",
    avatarBg: "#DBEAFE",
    avatarColor: "#1E40AF",
    avatarChar: "ณ",
    score: 88,
    priorityLevel: "สูง",
    triggerIcon: "🩺",
    triggerText: "ประกันสุขภาพใกล้ครบกำหนดใน 14 วัน",
  },
  {
    id: "c0a451ce-a2b5-406e-9358-4a2af87721ca",
    name: "วิภา ชัยโย",
    ref: "KS-00004",
    avatarBg: "#F3E8FF",
    avatarColor: "#6B21A8",
    avatarChar: "วิ",
    score: 76,
    priorityLevel: "กลาง",
    triggerIcon: "🏠",
    triggerText: "มีสินเชื่อบ้าน 5.5 ล้าน ใช้ประกันคุ้มครองวงเงิน",
  },
];

// ─── Sub-components: Custom SVG Charts for Reports View ─────────────────────

function PriorityDonutChart() {
  const size = 96;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Segments: Red 37.9%, Orange 25.0%, Blue 20.2%, Gray 16.9%
  const s1 = 0.379 * circumference;
  const s2 = 0.25 * circumference;
  const s3 = 0.202 * circumference;
  const s4 = 0.169 * circumference;

  const o1 = 0;
  const o2 = -s1;
  const o3 = -(s1 + s2);
  const o4 = -(s1 + s2 + s3);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ position: "relative", width: size, height: size, marginBottom: "8px" }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {/* Base track */}
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#F1F5F9" strokeWidth={strokeWidth} fill="none" />
          {/* Gray 16.9% */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#94A3B8"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${s4} ${circumference}`}
            strokeDashoffset={o4}
          />
          {/* Blue 20.2% */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#3B82F6"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${s3} ${circumference}`}
            strokeDashoffset={o3}
          />
          {/* Orange 25.0% */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#F97316"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${s2} ${circumference}`}
            strokeDashoffset={o2}
          />
          {/* Red 37.9% */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#EF4444"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${s1} ${circumference}`}
            strokeDashoffset={o1}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          }}
        >
          <span style={{ fontSize: "1.0625rem", fontWeight: 800, color: "#0F172A" }}>248</span>
          <span style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "2px" }}>ราย</span>
        </div>
      </div>
      {/* Legend list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "3px", width: "100%", fontSize: "0.75rem", color: "#475569" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#EF4444" }} />
            Priority 94
          </span>
          <span style={{ fontWeight: 700 }}>37.9%</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#F97316" }} />
            Priority 76
          </span>
          <span style={{ fontWeight: 700 }}>25.0%</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#3B82F6" }} />
            Priority 65
          </span>
          <span style={{ fontWeight: 700 }}>20.2%</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#94A3B8" }} />
            อื่น ๆ
          </span>
          <span style={{ fontWeight: 700 }}>16.9%</span>
        </div>
      </div>
    </div>
  );
}

function KycProgressGauge() {
  const size = 96;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressDash = 0.78 * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ position: "relative", width: size, height: size, marginBottom: "8px" }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#E2E8F0" strokeWidth={strokeWidth} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#10B981"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progressDash}
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
          }}
        >
          <span style={{ fontSize: "1.125rem", fontWeight: 900, color: "#0F172A" }}>78%</span>
        </div>
      </div>
      {/* Legend list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "3px", width: "100%", fontSize: "0.75rem", color: "#475569" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10B981" }} />
            ตรวจสอบแล้ว
          </span>
          <span style={{ fontWeight: 700 }}>192</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#94A3B8" }} />
            รอดำเนินการ
          </span>
          <span style={{ fontWeight: 700 }}>42</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#EF4444" }} />
            เอกสารไม่ครบ
          </span>
          <span style={{ fontWeight: 700 }}>14</span>
        </div>
      </div>
    </div>
  );
}

function RenewalPipelineChart() {
  const bars = [
    { label: "≤ 7 วัน", value: 18, height: 56 },
    { label: "8-15 วัน", value: 11, height: 38 },
    { label: "16-30 วัน", value: 9, height: 30 },
    { label: "> 30 วัน", value: 6, height: 20 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      {/* Bar visual area */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          width: "100%",
          height: "96px",
          paddingBottom: "4px",
          borderBottom: "1px solid #E2E8F0",
          marginBottom: "6px",
        }}
      >
        {bars.map((b, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#0F172A", marginBottom: "3px" }}>
              {b.value}
            </span>
            <div
              style={{
                width: "16px",
                height: `${b.height}px`,
                backgroundColor: "#FBBF24",
                borderRadius: "4px 4px 0 0",
                boxShadow: "0 2px 4px rgba(251,191,36,0.3)",
              }}
            />
          </div>
        ))}
      </div>
      {/* Bar labels */}
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: "0.75rem", color: "#64748B" }}>
        {bars.map((b, i) => (
          <div key={i} style={{ textAlign: "center", flex: 1, whiteSpace: "nowrap" }}>
            {b.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page Component ────────────────────────────────────────────────────

export default function MyProtectionPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<MobileTab>("reports"); // default to Reports (Image 1) or Dashboard (Image 2)
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [portfolioDropdown, setPortfolioDropdown] = useState("พอร์ตทั้งหมด");

  useEffect(() => {
    async function initUser() {
      try {
        const u = await api.auth.me();
        setUser(u);
      } catch {
        setUser({
          id: "u-broker-1",
          email: "broker1@krungsri.demo",
          full_name: "สมชาย นายหน้า",
          role: "broker",
          is_active: true,
        });
      }
    }
    initUser();
  }, []);

  const toggleTaskCompleted = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  // ─── Custom Mobile Header matching reference ──────────────────────────────
  const mobileHeader = (
    <div
      style={{
        padding: "10px 14px",
        backgroundColor: "#0B1E36",
        color: "#ffffff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        zIndex: 30,
        flexShrink: 0,
      }}
    >
      {/* Left: Krungsri Brand Emblem + Text */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Iconic Krungsri Gable Emblem */}
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              backgroundColor: "#FECB00",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(254,203,0,0.4)",
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L4 19h3.5l4.5-9 4.5 9H20L12 3z" fill="#452412" />
              <path d="M12 7.5l-2.2 6.5h4.4L12 7.5z" fill="#FECB00" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.02em" }}>
              krungsri
            </span>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#D1D5DB" }}>กรุงศรี</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: "1px", height: "22px", backgroundColor: "rgba(255,255,255,0.2)", margin: "0 4px" }} />

        {/* System Title */}
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#ffffff" }}>Broker Insight AI</span>
          <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>Krungsri Financial Advisory</span>
        </div>
      </div>

      {/* Right: Notification Bell + Somchai Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Bell with badge */}
        <div style={{ position: "relative", cursor: "pointer" }}>
          <span style={{ fontSize: "1.125rem", display: "block" }}>🔔</span>
          <span
            style={{
              position: "absolute",
              top: "-5px",
              right: "-6px",
              backgroundColor: "#DC2626",
              color: "#ffffff",
              fontSize: "0.75rem",
              fontWeight: 800,
              minWidth: "16px",
              height: "16px",
              padding: "0 2px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              border: "1.5px solid #0B1E36",
            }}
          >
            3
          </span>
        </div>

        {/* Somchai Avatar */}
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            overflow: "hidden",
            border: "1.5px solid rgba(254,203,0,0.8)",
            boxShadow: "0 0 8px rgba(254,203,0,0.3)",
            flexShrink: 0,
            position: "relative",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/somchai_avatar.jpg"
            alt="สมชาย นายหน้า"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      </div>
    </div>
  );

  // ─── Custom Mobile Bottom Tab Bar matching reference ──────────────────────
  const mobileBottomBar = (
    <div
      style={{
        backgroundColor: "#0B1E36",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "8px 4px 4px",
        flexShrink: 0,
        zIndex: 35,
      }}
    >
      {[
        { id: "dashboard" as MobileTab, label: "แดชบอร์ด", icon: "🏠" },
        { id: "customers" as MobileTab, label: "ลูกค้า", icon: "👥" },
        { id: "map" as MobileTab, label: "แผนที่ลูกค้า", icon: "📍" },
        { id: "reports" as MobileTab, label: "รายงาน", icon: "📊" },
        { id: "more" as MobileTab, label: "เพิ่มเติม", icon: "☰" },
      ].map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              if (tab.id === "map") {
                router.push("/visit-planner");
              } else if (tab.id === "customers") {
                router.push("/customers");
              } else {
                setActiveTab(tab.id);
              }
            }}
            style={{
              background: "none",
              border: "none",
              color: isActive ? "#FECB00" : "#94A3B8",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              cursor: "pointer",
              padding: "4px 8px",
              position: "relative",
              flex: 1,
              transition: "all 0.15s ease",
            }}
          >
            <span style={{ fontSize: "1.125rem", filter: isActive ? "drop-shadow(0 0 6px rgba(254,203,0,0.4))" : "none" }}>
              {tab.icon}
            </span>
            <span style={{ fontSize: "0.75rem", fontWeight: isActive ? 800 : 500, lineHeight: 1.2 }}>
              {tab.label}
            </span>
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  bottom: "-4px",
                  width: "28px",
                  height: "2.5px",
                  backgroundColor: "#FECB00",
                  borderRadius: "2px",
                  boxShadow: "0 0 6px rgba(254,203,0,0.8)",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <AppShell
      user={user}
      title="Broker Insight AI — โมบายล์เวิร์กสเปซ"
      subtitle="จำลองประสบการณ์แอปมือถือ Krungsri Broker Insight AI สำหรับนายหน้ามืออาชีพ"
      actions={
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Quick tab toggle button on top bar */}
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "0.8125rem",
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
              backgroundColor: activeTab === "dashboard" ? "#0B1E36" : "#E2E8F0",
              color: activeTab === "dashboard" ? "#FECB00" : "#475569",
              boxShadow: activeTab === "dashboard" ? "0 2px 6px rgba(11,30,54,0.3)" : "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🏠</span>
            <span>แท็บแดชบอร์ด (Dashboard)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reports")}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "0.8125rem",
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
              backgroundColor: activeTab === "reports" ? "#0B1E36" : "#E2E8F0",
              color: activeTab === "reports" ? "#FECB00" : "#475569",
              boxShadow: activeTab === "reports" ? "0 2px 6px rgba(11,30,54,0.3)" : "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>📊</span>
            <span>แท็บรายงาน (Reports)</span>
          </button>
          <Link href="/visit-planner" style={{ textDecoration: "none" }}>
            <button
              type="button"
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid #CBD5E1",
                backgroundColor: "#ffffff",
                color: "#1E293B",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span>📍</span>
              <span>แผนที่ลูกค้ารอบตัว</span>
            </button>
          </Link>
        </div>
      }
    >
      <SmartphoneMockup
        header={mobileHeader}
        bottomBar={mobileBottomBar}
        bgScreen="#F8FAFC"
        contentPadding="12px 10px 20px"
      >
        {/* ─── Hero Banner with Bangkok Skyline Background ─── */}
        <div
          style={{
            position: "relative",
            background: "linear-gradient(135deg, #0B1E36 0%, #162E4F 60%, #1A365D 100%)",
            borderRadius: "14px",
            padding: "14px",
            color: "#ffffff",
            overflow: "hidden",
            marginBottom: "12px",
            boxShadow: "0 4px 14px rgba(11,30,54,0.25)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Bangkok Skyline Dusk Image Overlay */}
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: "48%",
              backgroundImage: "url('/images/bangkok_skyline.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center right",
              opacity: 0.38,
              maskImage: "linear-gradient(to left, black 40%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to left, black 40%, transparent 100%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "space-between", gap: "10px" }}>
            {/* Left Content */}
            <div style={{ maxWidth: "62%" }}>
              {activeTab === "reports" ? (
                <>
                  <h2 style={{ fontSize: "1.0625rem", fontWeight: 900, color: "#ffffff", margin: "0 0 4px", letterSpacing: "-0.01em" }}>
                    รายงานและงานติดตาม
                  </h2>
                  <p style={{ fontSize: "0.75rem", color: "#CBD5E1", margin: 0, lineHeight: 1.5, fontFamily: "var(--font-reading-thai)" }}>
                    ติดตามความคืบหน้างาน วิเคราะห์พอร์ต และรับข้อมูลเชิงลึกจาก AI เพื่อวางแผนการดูแลลูกค้าได้อย่างมีประสิทธิภาพ
                  </p>
                </>
              ) : (
                <>
                  <h2 style={{ fontSize: "1.0625rem", fontWeight: 900, color: "#ffffff", margin: "0 0 4px", letterSpacing: "-0.01em" }}>
                    สวัสดีตอนเช้า คุณสมชาย
                  </h2>
                  <div style={{ fontSize: "0.75rem", color: "#F8FAFC", margin: "0 0 4px", fontWeight: 600, lineHeight: 1.3 }}>
                    วันนี้มีลูกค้าความสำคัญสูง <span style={{ color: "#FBBF24", fontWeight: 800 }}>42 ราย</span> และงานติดตาม{" "}
                    <span style={{ color: "#FBBF24", fontWeight: 800 }}>14 รายการ</span>
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "#CBD5E1", margin: 0, lineHeight: 1.4, fontFamily: "var(--font-reading-thai)" }}>
                    ใช้พลังของ AI เพื่อดูแลลูกค้าให้ดียิ่งขึ้น ในทุกโอกาสของชีวิต
                  </p>
                </>
              )}
            </div>

            {/* Right Quote Box */}
            <div
              style={{
                width: "35%",
                textAlign: "right",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                lineHeight: 1.35,
                borderLeft: "1px solid rgba(255,255,255,0.15)",
                paddingLeft: "8px",
              }}
            >
              <span style={{ fontSize: "0.75rem", color: "#E2E8F0", fontStyle: "italic", fontWeight: 500, fontFamily: "var(--font-reading-thai)" }}>
                “ดูแลวันนี้ เพื่ออนาคตที่มั่นคง ของทุกความสัมพันธ์”
              </span>
              <span style={{ fontSize: "0.75rem", color: "#FBBF24", fontWeight: 700, marginTop: "4px" }}>
                Together for a brighter tomorrow
              </span>
            </div>
          </div>
        </div>

        {/* ─── 4 Metric Grid Cards (2x2) ─── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          {activeTab === "reports" ? (
            <>
              {/* Card 1: งานติดตามทั้งหมด */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  padding: "10px 12px",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: "#EFF6FF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1rem",
                    }}
                  >
                    📅
                  </div>
                  <span style={{ fontSize: "0.875rem", color: "#94A3B8" }}>›</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>งานติดตามทั้งหมด</div>
                <div style={{ fontSize: "1.125rem", fontWeight: 900, color: "#0F172A", lineHeight: 1.2 }}>
                  14 <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>รายการ</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#16A34A", fontWeight: 700, marginTop: "2px" }}>
                  ↑ 12% จากเมื่อวาน
                </div>
              </div>

              {/* Card 2: งานเกินกำหนด */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  padding: "10px 12px",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "#FEE2E2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1rem",
                    }}
                  >
                    ⏰
                  </div>
                  <span style={{ fontSize: "0.875rem", color: "#94A3B8" }}>›</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>งานเกินกำหนด</div>
                <div style={{ fontSize: "1.125rem", fontWeight: 900, color: "#DC2626", lineHeight: 1.2 }}>
                  3 <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>รายการ</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#DC2626", fontWeight: 700, marginTop: "2px" }}>
                  ↑ 1 รายการ จากเมื่อวาน
                </div>
              </div>

              {/* Card 3: การติดต่อสำเร็จในสัปดาห์นี้ */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  padding: "10px 12px",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "#DCFCE7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1rem",
                    }}
                  >
                    📞
                  </div>
                  <span style={{ fontSize: "0.875rem", color: "#94A3B8" }}>›</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>การติดต่อสำเร็จในสัปดาห์นี้</div>
                <div style={{ fontSize: "1.125rem", fontWeight: 900, color: "#0F172A", lineHeight: 1.2 }}>
                  27 <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>ครั้ง</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#16A34A", fontWeight: 700, marginTop: "2px" }}>
                  ↑ 35% จากสัปดาห์ที่แล้ว
                </div>
              </div>

              {/* Card 4: Renewal ภายใน 30 วัน */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  padding: "10px 12px",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: "#FEF3C7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1rem",
                    }}
                  >
                    📄
                  </div>
                  <span style={{ fontSize: "0.875rem", color: "#94A3B8" }}>›</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>Renewal ภายใน 30 วัน</div>
                <div style={{ fontSize: "1.125rem", fontWeight: 900, color: "#0F172A", lineHeight: 1.2 }}>
                  18 <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>ฉบับ</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#16A34A", fontWeight: 700, marginTop: "2px" }}>
                  ↑ 20% จากเดือนที่แล้ว
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Card 1: ลูกค้าความสำคัญสูง */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  padding: "10px 12px",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "#FEE2E2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1rem",
                    }}
                  >
                    👤
                  </div>
                  <span style={{ fontSize: "0.875rem", color: "#94A3B8" }}>›</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>ลูกค้าความสำคัญสูง</div>
                <div style={{ fontSize: "1.125rem", fontWeight: 900, color: "#0F172A", lineHeight: 1.2 }}>
                  42 <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>ราย</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#16A34A", fontWeight: 700, marginTop: "2px" }}>
                  ↑ 12% จากสัปดาห์ที่แล้ว
                </div>
              </div>

              {/* Card 2: งานนัดหมายติดตาม */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  padding: "10px 12px",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: "#EFF6FF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1rem",
                    }}
                  >
                    📅
                  </div>
                  <span style={{ fontSize: "0.875rem", color: "#94A3B8" }}>›</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>งานนัดหมายติดตาม</div>
                <div style={{ fontSize: "1.125rem", fontWeight: 900, color: "#0F172A", lineHeight: 1.2 }}>
                  14 <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>รายการ</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#16A34A", fontWeight: 700, marginTop: "2px" }}>
                  ↑ 27% จากสัปดาห์ที่แล้ว
                </div>
              </div>

              {/* Card 3: รอตรวจสอบ KYC */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  padding: "10px 12px",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: "#FEF3C7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1rem",
                    }}
                  >
                    📄
                  </div>
                  <span style={{ fontSize: "0.875rem", color: "#94A3B8" }}>›</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>รอตรวจสอบ KYC</div>
                <div style={{ fontSize: "1.125rem", fontWeight: 900, color: "#0F172A", lineHeight: 1.2 }}>
                  28 <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>ราย</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#16A34A", fontWeight: 700, marginTop: "2px" }}>
                  ↑ 8% จากสัปดาห์ที่แล้ว
                </div>
              </div>

              {/* Card 4: ลูกค้ารวมในพอร์ต */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  padding: "10px 12px",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "#DCFCE7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1rem",
                    }}
                  >
                    👥
                  </div>
                  <span style={{ fontSize: "0.875rem", color: "#94A3B8" }}>›</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>ลูกค้ารวมในพอร์ต</div>
                <div style={{ fontSize: "1.125rem", fontWeight: 900, color: "#0F172A", lineHeight: 1.2 }}>
                  248 <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>ราย</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "2px" }}>
                  กรมธรรม์ Active 382 ฉบับ
                </div>
              </div>
            </>
          )}
        </div>

        {/* ─── Dashboard Only: ลูกค้าที่ควรให้ความสนใจวันนี้ (Image 2) ─── */}
        {activeTab === "dashboard" && (
          <div style={{ marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ fontSize: "0.875rem", fontWeight: 800, color: "#0F172A" }}>
                ลูกค้าที่ควรให้ความสนใจวันนี้
              </div>
              <Link href="/customers" style={{ fontSize: "0.75rem", color: "#2563EB", fontWeight: 700, textDecoration: "none" }}>
                ดูทั้งหมด ›
              </Link>
            </div>

            {/* 3 Horizontal Attention Customer Cards */}
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }} className="custom-scrollbar">
              {ATTENTION_CUSTOMERS.map((cust) => (
                <div
                  key={cust.id}
                  style={{
                    minWidth: "160px",
                    maxWidth: "160px",
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #E2E8F0",
                    padding: "10px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    flexShrink: 0,
                  }}
                >
                  <div>
                    {/* Avatar + Name */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          backgroundColor: cust.avatarBg,
                          color: cust.avatarColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.8125rem",
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {cust.avatarChar}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 800,
                            color: "#0F172A",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {cust.name}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>{cust.ref}</div>
                      </div>
                    </div>

                    {/* Priority Tag */}
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "6px" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          backgroundColor: cust.score >= 85 ? "#FEE2E2" : "#FEF3C7",
                          color: cust.score >= 85 ? "#DC2626" : "#D97706",
                          padding: "1px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        Priority {cust.score}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>
                        {cust.priorityLevel}
                      </span>
                    </div>

                    {/* Trigger info */}
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#334155",
                        lineHeight: 1.45,
                        minHeight: "34px",
                        marginBottom: "8px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "4px",
                        fontFamily: "var(--font-reading-thai)",
                      }}
                    >
                      <span style={{ fontSize: "0.75rem" }}>{cust.triggerIcon}</span>
                      <span>{cust.triggerText}</span>
                    </div>
                  </div>

                  {/* Detail link */}
                  <Link
                    href={`/customers/${cust.id}`}
                    style={{
                      textDecoration: "none",
                      backgroundColor: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: "6px",
                      padding: "6px",
                      textAlign: "center",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#1E293B",
                      display: "block",
                      transition: "all 0.15s ease",
                    }}
                  >
                    ดูรายละเอียด →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── งานที่ต้องทำวันนี้ / งานติดตามของวันนี้ (4 รายการ) ─── */}
        <div style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ fontSize: "0.875rem", fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: "5px" }}>
              <span>📅</span>
              <span>{activeTab === "reports" ? "งานติดตามของวันนี้ (4 รายการ)" : "งานที่ต้องทำวันนี้ (4 รายการ)"}</span>
            </div>
            <span style={{ fontSize: "0.75rem", color: "#2563EB", fontWeight: 700, cursor: "pointer" }}>
              {activeTab === "reports" ? "ดูงานทั้งหมด ›" : "ดูทั้งหมด ›"}
            </span>
          </div>

          {/* Task list container */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            {tasks.map((t, idx) => (
              <div
                key={t.id}
                style={{
                  padding: "10px 12px",
                  borderBottom: idx < tasks.length - 1 ? "1px solid #F1F5F9" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  backgroundColor: t.completed ? "#F8FAFC" : "#ffffff",
                  transition: "background-color 0.15s ease",
                }}
              >
                {/* Left: Checkbox + Time + Icon + Text */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                  {/* Square Checkbox */}
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={() => toggleTaskCompleted(t.id)}
                    style={{
                      width: "15px",
                      height: "15px",
                      borderRadius: "4px",
                      accentColor: "#2563EB",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  />

                  {/* Time */}
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748B",
                      fontWeight: 600,
                      flexShrink: 0,
                      width: "38px",
                    }}
                  >
                    {t.time}
                  </span>

                  {/* Icon */}
                  <span style={{ fontSize: "0.9375rem", flexShrink: 0 }}>{t.icon}</span>

                  {/* Title & Customer */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        color: t.completed ? "#94A3B8" : "#0F172A",
                        textDecoration: t.completed ? "line-through" : "none",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {t.title}
                    </div>
                    {t.subtitle && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#64748B",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {t.subtitle}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Customer Ref + Status Pill + More */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#1E293B",
                        maxWidth: "90px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {t.customerName.split(" ")[0]}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>{t.customerId}</div>
                  </div>

                  {/* Status badge */}
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      whiteSpace: "nowrap",
                      backgroundColor:
                        t.status === "completed" || t.completed
                          ? "#DCFCE7"
                          : t.status === "scheduled"
                          ? "#DCFCE7"
                          : t.status === "in_progress"
                          ? "#EFF6FF"
                          : "#FEE2E2",
                      color:
                        t.status === "completed" || t.completed
                          ? "#16A34A"
                          : t.status === "scheduled"
                          ? "#16A34A"
                          : t.status === "in_progress"
                          ? "#2563EB"
                          : "#DC2626",
                    }}
                  >
                    {t.completed
                      ? "เสร็จสิ้น"
                      : t.status === "scheduled"
                      ? "นัดหมายแล้ว"
                      : t.status === "in_progress"
                      ? "กำลังดำเนินการ"
                      : "รอดำเนินการ"}
                  </span>

                  {/* More icon */}
                  <span style={{ fontSize: "0.875rem", color: "#94A3B8", cursor: "pointer", padding: "0 2px" }}>···</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Reports Only: ภาพรวมพอร์ตวันนี้ (Image 1) ─── */}
        {activeTab === "reports" && (
          <div style={{ marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ fontSize: "0.875rem", fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: "5px" }}>
                <span>📊</span>
                <span>ภาพรวมพอร์ตวันนี้</span>
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#475569",
                  backgroundColor: "#F1F5F9",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  cursor: "pointer",
                }}
              >
                <span>{portfolioDropdown}</span>
                <span>⌄</span>
              </div>
            </div>

            {/* 3 Visual Charts Row in White Card */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #E2E8F0",
                padding: "12px 10px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "10px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              {/* Chart 1: สัดส่วนลูกค้า Priority */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#0F172A", marginBottom: "8px", textAlign: "center" }}>
                  สัดส่วนลูกค้า Priority
                </div>
                <PriorityDonutChart />
              </div>

              {/* Chart 2: ความคืบหน้า KYC */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  borderLeft: "1px solid #F1F5F9",
                  borderRight: "1px solid #F1F5F9",
                  padding: "0 4px",
                }}
              >
                <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#0F172A", marginBottom: "8px", textAlign: "center" }}>
                  ความคืบหน้า KYC
                </div>
                <KycProgressGauge />
              </div>

              {/* Chart 3: Renewal Pipeline (ภายใน 30 วัน) */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#0F172A", marginBottom: "4px", textAlign: "center", lineHeight: 1.2 }}>
                  Renewal Pipeline
                  <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>(ภายใน 30 วัน)</div>
                </div>
                <RenewalPipelineChart />
              </div>
            </div>
          </div>
        )}

        {/* ─── AI Insight / Recommendation Banner ─── */}
        <div
          style={{
            backgroundColor: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: "12px",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(245,158,11,0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                backgroundColor: "#FEF3C7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
                flexShrink: 0,
              }}
            >
              💡
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#92400E" }}>
                {activeTab === "reports" ? "สรุปจาก AI" : "ข้อมูลแนะนำจาก AI"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#78350F", lineHeight: 1.45, fontFamily: "var(--font-reading-thai)" }}>
                {activeTab === "reports"
                  ? "กลุ่มลูกค้าที่ควรโฟกัสมากที่สุดวันนี้คือกลุ่ม renewal ใกล้ครบกำหนด และลูกค้า KYC pending"
                  : "AI ช่วยจัดลำดับความสำคัญ เพื่อให้คุณโฟกัสสิ่งที่สำคัญที่สุด"}
              </div>
            </div>
          </div>
          <span style={{ fontSize: "0.875rem", color: "#B45309", fontWeight: 700 }}>›</span>
        </div>
      </SmartphoneMockup>
    </AppShell>
  );
}
