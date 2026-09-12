"use client";
import React from "react";

export function AIRecommendationWidget() {
  return (
    <div
      style={{
        backgroundColor: "#FFFDF0",
        borderRadius: "14px",
        border: "1px solid #FEF08A",
        boxShadow: "0 1px 3px rgba(254, 203, 0, 0.08)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
      }}
    >
      <div>
        {/* Top Header Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <span
            style={{
              backgroundColor: "#FECC00",
              color: "#0F172A",
              fontSize: "0.75rem",
              fontWeight: 900,
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            AI
          </span>
          <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "#0F172A" }}>
            ข้อมูลแนะนำจาก AI
          </span>
        </div>

        {/* Lightbulb + Mission Title */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "12px" }}>
          <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>💡</span>
          <div
            style={{
              fontSize: "0.875rem",
              fontWeight: 800,
              color: "#1E293B",
              lineHeight: "var(--lh-ui, 1.45)",
            }}
          >
            AI ช่วยจัดลำดับความสำคัญ เพื่อให้คุณโฟกัสสิ่งที่สำคัญที่สุด
          </div>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: "0.8125rem",
            fontFamily: "var(--font-reading-thai)",
            color: "#475569",
            lineHeight: "var(--lh-reading, 1.7)",
            margin: "0 0 16px 0",
          }}
        >
          เราวิเคราะห์ข้อมูลลูกค้า กรมธรรม์ พฤติกรรม และโอกาสทางการขาย เพื่อแนะนำลูกค้าที่ควรดูแล และงานที่ควรทำในวันนี้
        </p>

        {/* Human-in-the-Loop Advisor Highlight Card */}
        <div
          style={{
            backgroundColor: "#FEF9C3",
            border: "1px solid #FDE047",
            borderRadius: "10px",
            padding: "12px 14px",
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            marginBottom: "16px",
          }}
        >
          <span style={{ fontSize: "1.1rem", flexShrink: 0, marginTop: "1px" }}>👥</span>
          <span
            style={{
              fontSize: "0.8125rem",
              fontFamily: "var(--font-reading-thai)",
              fontWeight: 600,
              color: "#713F12",
              lineHeight: "var(--lh-reading, 1.7)",
            }}
          >
            แต่การตัดสินใจขั้นสุดท้าย ยังคงเป็นของคุณเสมอ เพราะคุณคือผู้เชี่ยวชาญที่รู้จักลูกค้าดีที่สุด
          </span>
        </div>
      </div>

      {/* Footer Accent */}
      <div style={{ paddingTop: "12px", borderTop: "1px solid #FEF08A" }}>
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#94A3B8",
            letterSpacing: "0.02em",
          }}
        >
          Empower Your Advisory Journey
        </div>
        <div
          style={{
            width: "48px",
            height: "3px",
            backgroundColor: "#FECC00",
            borderRadius: "2px",
            marginTop: "6px",
          }}
        />
      </div>
    </div>
  );
}
