"use client";
import React, { useState } from "react";
import { useOnboardingTour } from "@/context/OnboardingTourContext";
import { FEATURE_CATALOG_ITEMS } from "@/lib/onboardingSteps";

export function OnboardingWelcomeModal() {
  const {
    showWelcome,
    showFeatureCatalog,
    startTour,
    closeWelcome,
    closeFeatureCatalog,
  } = useOnboardingTour();

  // Mode: "step-by-step" (interactive feature-by-feature walkthrough) or "catalog" (grid)
  const [viewMode, setViewMode] = useState<"step-by-step" | "catalog">("step-by-step");
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);

  const isOpen = showWelcome || showFeatureCatalog;

  if (!isOpen) return null;

  const handleClose = () => {
    if (showFeatureCatalog) {
      closeFeatureCatalog();
    } else {
      closeWelcome();
    }
  };

  const handleStartFullTour = () => {
    startTour(undefined, 0);
  };

  const handleSelectFeature = (stepIndex: number) => {
    startTour(undefined, stepIndex);
  };

  const currentFeature = FEATURE_CATALOG_ITEMS[currentFeatureIndex] || FEATURE_CATALOG_ITEMS[0];
  const isFirstFeature = currentFeatureIndex === 0;
  const isLastFeature = currentFeatureIndex === FEATURE_CATALOG_ITEMS.length - 1;

  const handlePrevFeature = () => {
    if (currentFeatureIndex > 0) {
      setCurrentFeatureIndex(currentFeatureIndex - 1);
    }
  };

  const handleNextFeature = () => {
    if (currentFeatureIndex < FEATURE_CATALOG_ITEMS.length - 1) {
      setCurrentFeatureIndex(currentFeatureIndex + 1);
    } else {
      // If at end, start full tour
      handleStartFullTour();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(11, 30, 54, 0.78)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
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
          maxWidth: viewMode === "catalog" ? "720px" : "620px",
          backgroundColor: "#ffffff",
          borderRadius: "18px",
          boxShadow: "0 25px 50px -12px rgba(11, 30, 54, 0.45)",
          border: "1px solid rgba(226, 232, 240, 0.9)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: "scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          transition: "max-width 0.2s ease",
        }}
      >
        {/* Krungsri Brand Accent Bar */}
        <div
          style={{
            height: "6px",
            background: "linear-gradient(90deg, #FECB00 0%, #F59E0B 40%, #2563EB 100%)",
          }}
        />

        <div style={{ padding: "26px 26px 22px" }}>
          {/* Header Row: Badge & Mode Switcher & Close Button */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                ยินดีต้อนรับสู่ระบบ Krungsri Hackathon Edition
              </span>
            </div>

            {/* View Mode Toggle Switch */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  display: "inline-flex",
                  backgroundColor: "#F1F5F9",
                  padding: "2px",
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewMode("step-by-step")}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: viewMode === "step-by-step" ? "#ffffff" : "transparent",
                    color: viewMode === "step-by-step" ? "#0F172A" : "#64748B",
                    fontSize: "12px",
                    fontWeight: viewMode === "step-by-step" ? 800 : 600,
                    cursor: "pointer",
                    boxShadow: viewMode === "step-by-step" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  🎯 แนะนำทีละฟีเจอร์
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("catalog")}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: viewMode === "catalog" ? "#ffffff" : "transparent",
                    color: viewMode === "catalog" ? "#0F172A" : "#64748B",
                    fontSize: "12px",
                    fontWeight: viewMode === "catalog" ? 800 : 600,
                    cursor: "pointer",
                    boxShadow: viewMode === "catalog" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  📑 สารบัญทั้งหมด ({FEATURE_CATALOG_ITEMS.length})
                </button>
              </div>

              <button
                type="button"
                onClick={handleClose}
                aria-label="ปิด"
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "16px",
                  color: "#94A3B8",
                  cursor: "pointer",
                  padding: "4px",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {viewMode === "step-by-step" ? (
            /* ─── View 1: Step-by-Step Feature Walkthrough Carousel ─── */
            <>
              <div style={{ marginBottom: "14px" }}>
                <h2
                  id="welcome-title"
                  style={{
                    fontSize: "21px",
                    fontWeight: 800,
                    color: "#0F172A",
                    margin: "0 0 4px 0",
                    lineHeight: 1.3,
                  }}
                >
                  แนะนำฟีเจอร์ทั้งหมดในระบบ Broker Insight AI
                </h2>
                <p
                  className="font-reading"
                  style={{
                    fontFamily: "var(--font-reading-thai)",
                    fontSize: "13.5px",
                    color: "#475569",
                    lineHeight: "var(--lh-reading)",
                    margin: 0,
                  }}
                >
                  ระบบผู้ช่วยอัจฉริยะสำหรับนายหน้าประกัน ดูสรุปทีละฟีเจอร์ หรือกดเริ่มทัวร์ในหน้าจริงได้ทันที
                </p>
              </div>

              {/* Active Feature Spotlight Card */}
              <div
                style={{
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "14px",
                  padding: "18px 20px",
                  marginBottom: "16px",
                  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                  position: "relative",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Step Metadata Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 800,
                        color: "#1D4ED8",
                        backgroundColor: "#EFF6FF",
                        border: "1px solid #BFDBFE",
                        padding: "3px 10px",
                        borderRadius: "999px",
                      }}
                    >
                      ฟีเจอร์ที่ {currentFeatureIndex + 1} จาก {FEATURE_CATALOG_ITEMS.length}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#475569",
                        backgroundColor: "#E2E8F0",
                        padding: "3px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      {currentFeature.tag}
                    </span>
                  </div>

                  <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                    ปลายทาง: <code style={{ backgroundColor: "#E2E8F0", padding: "1px 5px", borderRadius: "4px" }}>{currentFeature.route}</code>
                  </span>
                </div>

                {/* Feature Title & Subtitle */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "32px", lineHeight: 1 }}>{currentFeature.icon}</span>
                  <div>
                    <h3
                      style={{
                        fontSize: "17px",
                        fontWeight: 800,
                        color: "#0B1E36",
                        margin: "0 0 4px 0",
                      }}
                    >
                      {currentFeature.title}
                    </h3>
                    <p
                      className="font-reading"
                      style={{
                        fontFamily: "var(--font-reading-thai)",
                        fontSize: "13.5px",
                        color: "#334155",
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {currentFeature.subtitle}
                    </p>
                  </div>
                </div>

                {/* Feature Key Highlights (Bullet Points) */}
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #E2E8F0",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    marginBottom: "14px",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: "6px", letterSpacing: "0.03em" }}>
                    จุดเด่นและความสามารถสำคัญ:
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {currentFeature.highlights.map((h, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#1E293B" }}>
                        <span style={{ color: "#16A34A", fontWeight: 800, fontSize: "12px" }}>✓</span>
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feature-specific Action: Jump into Real Screen */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "4px" }}>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>
                    💡 นายหน้าเป็นผู้ตัดสินใจในทุกขั้นตอน
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectFeature(currentFeature.stepIndex)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 14px",
                      borderRadius: "6px",
                      border: "1px solid #2563EB",
                      backgroundColor: "#EFF6FF",
                      color: "#1D4ED8",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#DBEAFE";
                      e.currentTarget.style.borderColor = "#1D4ED8";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#EFF6FF";
                      e.currentTarget.style.borderColor = "#2563EB";
                    }}
                  >
                    <span>🚀 พาไปดูฟีเจอร์นี้ในหน้าจอจริง</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              {/* Stepper Dot Indicators & Prev/Next Carousel Controls */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                  padding: "0 4px",
                }}
              >
                <button
                  type="button"
                  onClick={handlePrevFeature}
                  disabled={isFirstFeature}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 14px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: isFirstFeature ? "#F8FAFC" : "#ffffff",
                    color: isFirstFeature ? "#94A3B8" : "#334155",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    cursor: isFirstFeature ? "not-allowed" : "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>← ย้อนกลับ</span>
                </button>

                {/* 9 Stepper Dots */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {FEATURE_CATALOG_ITEMS.map((item, idx) => {
                    const isActive = idx === currentFeatureIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCurrentFeatureIndex(idx)}
                        title={`ข้ามไปยัง ${item.title}`}
                        style={{
                          width: isActive ? "24px" : "8px",
                          height: "8px",
                          borderRadius: "4px",
                          backgroundColor: isActive ? "#FECB00" : "#CBD5E1",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      />
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleNextFeature}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 16px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: isLastFeature ? "#16A34A" : "#0B1E36",
                    color: "#ffffff",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{isLastFeature ? "เริ่มทัวร์จริง 🎉" : "ฟีเจอร์ถัดไป →"}</span>
                </button>
              </div>

              {/* Bottom Actions Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "12px",
                  borderTop: "1px solid #F1F5F9",
                }}
              >
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#64748B",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "6px 10px",
                  }}
                >
                  ข้ามไปก่อน
                </button>

                <button
                  type="button"
                  onClick={handleStartFullTour}
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
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 3px 10px rgba(254, 203, 0, 0.45)",
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
                  <span>🌟 เริ่มทัวร์ครบทุกฟีเจอร์ในหน้าจริง →</span>
                </button>
              </div>
            </>
          ) : (
            /* ─── View 2: Complete Feature Catalog Grid (All 9 Features) ─── */
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <h2
                  id="welcome-title"
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "#0F172A",
                    margin: 0,
                  }}
                >
                  สารบัญฟีเจอร์ทั้งหมดในระบบ ({FEATURE_CATALOG_ITEMS.length} ฟีเจอร์)
                </h2>
                <button
                  type="button"
                  onClick={() => setViewMode("step-by-step")}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "12.5px",
                    color: "#2563EB",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ← กลับสู่โหมดแนะนำทีละฟีเจอร์
                </button>
              </div>

              <p
                className="font-reading"
                style={{
                  fontFamily: "var(--font-reading-thai)",
                  fontSize: "13.5px",
                  color: "#475569",
                  lineHeight: "var(--lh-reading)",
                  margin: "0 0 16px 0",
                }}
              >
                คลิกเลือกฟีเจอร์ใดก็ได้เพื่อให้ระบบพาไปเปิดและแนะนำในหน้าจอจริงทันที:
              </p>

              {/* 9 Feature Catalog Cards Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  maxHeight: "360px",
                  overflowY: "auto",
                  paddingRight: "4px",
                  marginBottom: "18px",
                }}
                className="custom-scrollbar"
              >
                {FEATURE_CATALOG_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectFeature(item.stepIndex)}
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #E2E8F0",
                      borderRadius: "12px",
                      padding: "12px 14px",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      transition: "all 0.15s ease",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#FECB00";
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 6px 14px rgba(254, 203, 0, 0.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#E2E8F0";
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.03)";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "20px" }}>{item.icon}</span>
                        <strong style={{ fontSize: "13.5px", color: "#0F172A", fontWeight: 800 }}>
                          {item.title}
                        </strong>
                      </div>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#1D4ED8",
                          backgroundColor: "#EFF6FF",
                          padding: "1px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        {item.tag}
                      </span>
                    </div>

                    <p className="font-reading" style={{ fontSize: "12px", color: "#64748B", margin: 0, lineHeight: 1.4 }}>
                      {item.subtitle}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px", paddingTop: "4px", borderTop: "1px dashed #F1F5F9" }}>
                      <span style={{ fontSize: "12px", color: "#16A34A", fontWeight: 700 }}>
                        ✓ {item.highlights[0]}
                      </span>
                      <span style={{ fontSize: "12px", color: "#2563EB", fontWeight: 800 }}>
                        เริ่มทัวร์ →
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Bottom Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "8px",
                  borderTop: "1px solid #F1F5F9",
                }}
              >
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#64748B",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "6px 10px",
                  }}
                >
                  ปิดหน้าต่าง
                </button>

                <button
                  type="button"
                  onClick={handleStartFullTour}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 18px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#0B1E36",
                    color: "#FECB00",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#162E4F")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0B1E36")}
                >
                  <span>เริ่มทัวร์ตามลำดับตั้งแต่ต้น (9 ขั้นตอน)</span>
                  <span>→</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
