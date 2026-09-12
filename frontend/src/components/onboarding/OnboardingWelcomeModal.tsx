"use client";
import React from "react";
import { useOnboardingTour } from "@/context/OnboardingTourContext";

export function OnboardingWelcomeModal() {
  const { showWelcome, startTour, closeWelcome } = useOnboardingTour();

  if (!showWelcome) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(11, 30, 54, 0.72)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "540px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(11, 30, 54, 0.35)",
          border: "1px solid rgba(226, 232, 240, 0.8)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: "scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Krungsri Brand Accent Bar */}
        <div
          style={{
            height: "6px",
            background: "linear-gradient(90deg, #FECB00 0%, #F59E0B 50%, #2563EB 100%)",
          }}
        />

        <div style={{ padding: "32px 28px 24px" }}>
          {/* Header Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                borderRadius: "999px",
                backgroundColor: "#FEF3C7",
                border: "1px solid #FDE68A",
                color: "#92400E",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#D97706",
                }}
              />
              ยินดีต้อนรับสู่ระบบ
            </span>
            <span
              style={{
                fontSize: "12px",
                color: "#64748B",
                fontWeight: 600,
              }}
            >
              Krungsri Hackathon Edition
            </span>
          </div>

          {/* Title */}
          <h2
            id="welcome-title"
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#0F172A",
              margin: "0 0 10px 0",
              lineHeight: 1.3,
            }}
          >
            ยินดีต้อนรับสู่ Broker Insight AI
          </h2>

          {/* Subtitle */}
          <p
            className="font-reading"
            style={{
              fontFamily: "var(--font-reading-thai)",
              fontSize: "14.5px",
              color: "#475569",
              lineHeight: "var(--lh-reading)",
              margin: "0 0 20px 0",
            }}
          >
            ผู้ช่วยอัจฉริยะสำหรับช่วยให้นายหน้าประกันเข้าใจลูกค้า
            จัดลำดับความสำคัญ และตัดสินใจได้อย่างมีประสิทธิภาพ
          </p>

          {/* Key Value Highlights */}
          <div
            style={{
              backgroundColor: "#F8FAFC",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <span style={{ fontSize: "18px", flexShrink: 0 }}>🧠</span>
              <div className="font-reading" style={{ fontFamily: "var(--font-reading-thai)", fontSize: "13.5px", color: "#334155", lineHeight: "var(--lh-reading)" }}>
                <strong style={{ fontFamily: "var(--font-ui-thai)", color: "#0F172A" }}>AI ช่วยวิเคราะห์และจัดลำดับความสำคัญ:</strong>{" "}
                ประเมินคะแนน Priority และเหตุผล &ldquo;Why Now&rdquo; เพื่อให้คุณโฟกัสลูกค้าที่ต้องการความคุ้มครองสูงสุด
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <span style={{ fontSize: "18px", flexShrink: 0 }}>📍</span>
              <div className="font-reading" style={{ fontFamily: "var(--font-reading-thai)", fontSize: "13.5px", color: "#334155", lineHeight: "var(--lh-reading)" }}>
                <strong style={{ fontFamily: "var(--font-ui-thai)", color: "#0F172A" }}>ค้นหาลูกค้าใกล้เคียงและนำทาง:</strong>{" "}
                ค้นพบลูกค้าในรัศมีรอบตัวคุณ พร้อมระยะทางและเวลาเดินทางจริงเมื่อคุณต้องการเข้าพบ
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <span style={{ fontSize: "18px", flexShrink: 0 }}>🛡️</span>
              <div className="font-reading" style={{ fontFamily: "var(--font-reading-thai)", fontSize: "13.5px", color: "#334155", lineHeight: "var(--lh-reading)" }}>
                <strong style={{ fontFamily: "var(--font-ui-thai)", color: "#0F172A" }}>นายหน้าเป็นผู้ตัดสินใจเองเสมอ:</strong>{" "}
                ระบบเป็นเครื่องมือสนับสนุนการตัดสินใจ (Decision Support) คุณเป็นผู้เลือกลูกค้าและวางแผนงานด้วยตัวเอง
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "12px",
            }}
          >
            <button
              onClick={closeWelcome}
              style={{
                padding: "10px 18px",
                borderRadius: "8px",
                border: "1px solid #CBD5E1",
                backgroundColor: "#ffffff",
                color: "#475569",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#F1F5F9";
                e.currentTarget.style.color = "#0F172A";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ffffff";
                e.currentTarget.style.color = "#475569";
              }}
            >
              ข้ามไปก่อน
            </button>

            <button
              onClick={() => startTour()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 22px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#FECB00",
                color: "#0B1E36",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(254, 203, 0, 0.4)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#EAB308";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#FECB00";
                e.currentTarget.style.transform = "none";
              }}
            >
              <span>เริ่มแนะนำระบบ</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
