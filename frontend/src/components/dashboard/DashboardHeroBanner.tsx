"use client";
import React from "react";
import type { User } from "@/types";
import { useOnboardingTour } from "@/context/OnboardingTourContext";

interface DashboardHeroBannerProps {
  user: User | null;
  highPriorityCount?: number;
  tasksCount?: number;
}

export function DashboardHeroBanner({
  user,
  highPriorityCount = 42,
  tasksCount = 14,
}: DashboardHeroBannerProps) {
  const brokerName = user?.full_name ? user.full_name.split(" ")[0] : "สมชาย";
  const { openWelcomeModal } = useOnboardingTour();

  return (
    <div
      style={{
        position: "relative",
        borderRadius: "16px",
        background: "linear-gradient(105deg, #091E3A 0%, #0F2B4D 45%, #16365C 100%)",
        color: "#ffffff",
        marginBottom: "20px",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(9, 30, 58, 0.15)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        display: "flex",
        minHeight: "170px",
      }}
    >
      {/* Background Skyline Image with smooth gradient overlay on the right */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "55%",
          backgroundImage: "url('/images/bangkok_skyline.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center right",
          opacity: 0.65,
          pointerEvents: "none",
          maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,1) 80%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,1) 80%)",
        }}
      />

      {/* Atmospheric warm golden glow overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: "15%",
          width: "350px",
          height: "120px",
          background: "radial-gradient(ellipse at bottom, rgba(245, 158, 11, 0.25) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Content Container */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "24px 32px",
          gap: "24px",
          flexWrap: "wrap",
        }}
      >
        {/* Left: Greeting & AI Mission */}
        <div style={{ maxWidth: "600px" }}>
          <h1
            style={{
              fontSize: "1.625rem",
              fontWeight: 800,
              margin: 0,
              lineHeight: 1.25,
              color: "#FFFFFF",
              letterSpacing: "-0.01em",
            }}
          >
            สวัสดีตอนเช้า คุณ{brokerName}
          </h1>

          <div
            style={{
              fontSize: "1.0625rem",
              marginTop: "8px",
              marginBottom: "6px",
              color: "#E2E8F0",
              fontWeight: 500,
            }}
          >
            วันนี้คุณมี{" "}
            <span style={{ color: "#FACC15", fontWeight: 800 }}>
              ลูกค้าความสำคัญสูง {highPriorityCount} ราย
            </span>{" "}
            และ{" "}
            <span style={{ color: "#FACC15", fontWeight: 800 }}>
              งานติดตาม {tasksCount} รายการ
            </span>
          </div>

          <p
            style={{
              margin: 0,
              fontSize: "0.875rem",
              fontFamily: "var(--font-reading-thai)",
              color: "#CBD5E1",
              fontWeight: 400,
              lineHeight: "var(--lh-reading, 1.7)",
            }}
          >
            ใช้พลังของ AI เพื่อดูแลลูกค้าให้ดียิ่งขึ้น ในทุกโอกาสของชีวิต
          </p>

          <div style={{ marginTop: "12px", display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={() => openWelcomeModal()}
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                borderRadius: "8px",
                backgroundColor: "rgba(254, 203, 0, 0.16)",
                border: "1px solid rgba(254, 203, 0, 0.6)",
                color: "#FACC15",
                fontSize: "0.8125rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#FECB00";
                e.currentTarget.style.color = "#3b2c2b";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(254, 203, 0, 0.16)";
                e.currentTarget.style.color = "#FACC15";
              }}
              title="เปิดคู่มือและทัวร์แนะนำทุกฟีเจอร์ของระบบทีละฟีเจอร์"
            >
              <span>🧭</span>
              <span>แนะนำฟีเจอร์ทั้งหมดของระบบ</span>
            </button>
          </div>
        </div>

        {/* Right: Slogan & Motto Box */}
        <div
          style={{
            backgroundColor: "rgba(11, 30, 54, 0.4)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "12px",
            padding: "14px 20px",
            textAlign: "right",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          }}
        >
          <div
            style={{
              fontSize: "0.875rem",
              fontFamily: "var(--font-reading-thai)",
              fontWeight: 600,
              color: "#F8FAFC",
              letterSpacing: "0.01em",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span style={{ color: "#FACC15", fontSize: "1.1rem", lineHeight: 1 }}>“</span>
            <span>ดูแลวันนี้ เพื่ออนาคตที่มั่นคง ของทุกความสัมพันธ์</span>
            <span style={{ color: "#FACC15", fontSize: "1.1rem", lineHeight: 1 }}>”</span>
          </div>

          <div
            style={{
              fontSize: "0.75rem",
              color: "#94A3B8",
              marginTop: "8px",
              fontWeight: 500,
              letterSpacing: "0.03em",
              textAlign: "right",
            }}
          >
            <div>Together</div>
            <div style={{ color: "#CBD5E1" }}>for a brighter tomorrow</div>
          </div>
        </div>
      </div>
    </div>
  );
}
