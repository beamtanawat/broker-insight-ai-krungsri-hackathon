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

  const [activeView, setActiveView] = useState<"welcome" | "catalog">("welcome");

  const isOpen = showWelcome || showFeatureCatalog;
  const isCatalogMode = showFeatureCatalog || activeView === "catalog";

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(11, 30, 54, 0.76)",
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
          maxWidth: isCatalogMode ? "680px" : "560px",
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

        <div style={{ padding: "28px 26px 24px" }}>
          {/* Header Row: Badge & Close Button */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
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
                ยินดีต้อนรับสู่ระบบ
              </span>
              <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                Krungsri Financial Advisory
              </span>
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

          {!isCatalogMode ? (
            /* ─── View 1: Main Welcome & Quick Start ─── */
            <>
              <h2
                id="welcome-title"
                style={{
                  fontSize: "23px",
                  fontWeight: 800,
                  color: "#0F172A",
                  margin: "0 0 8px 0",
                  lineHeight: 1.3,
                }}
              >
                ยินดีต้อนรับสู่ Broker Insight AI
              </h2>

              <p
                className="font-reading"
                style={{
                  fontFamily: "var(--font-reading-thai)",
                  fontSize: "14.5px",
                  color: "#475569",
                  lineHeight: "var(--lh-reading)",
                  margin: "0 0 18px 0",
                }}
              >
                ผู้ช่วยอัจฉริยะสำหรับช่วยให้นายหน้าประกันเข้าใจลูกค้าในเชิงลึก
                จัดลำดับความสำคัญ วางแผนเข้าพบ และตัดสินใจได้อย่างมั่นใจ
              </p>

              {/* 4 Flagship Feature Pillars */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  marginBottom: "22px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "18px" }}>🧠</span>
                    <strong style={{ fontSize: "13px", color: "#0F172A", fontWeight: 700 }}>AI Why Now & SHAP</strong>
                  </div>
                  <p className="font-reading" style={{ fontSize: "12px", color: "#64748B", margin: 0, lineHeight: 1.45 }}>
                    ประเมินคะแนนเร่งด่วน พร้อมแจกแจงเหตุผลเชิงบวก/ลบด้วย TreeSHAP ภาษาไทย
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "18px" }}>📍</span>
                    <strong style={{ fontSize: "13px", color: "#0F172A", fontWeight: 700 }}>แผนที่ลูกค้า & นำทางจริง</strong>
                  </div>
                  <p className="font-reading" style={{ fontSize: "12px", color: "#64748B", margin: 0, lineHeight: 1.45 }}>
                    ค้นหาลูกค้ารอบตัวในรัศมี 5–20 กม. พร้อมปุ่มนำทาง Google Maps On-Demand
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "18px" }}>📱</span>
                    <strong style={{ fontSize: "13px", color: "#0F172A", fontWeight: 700 }}>โมบายล์เวิร์กสเปซ</strong>
                  </div>
                  <p className="font-reading" style={{ fontSize: "12px", color: "#64748B", margin: 0, lineHeight: 1.45 }}>
                    จำลองแอปมือถือ iPhone 17 Pro Max มีทั้งแดชบอร์ดงานและกราฟรายงานพอร์ต
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "18px" }}>🛡️</span>
                    <strong style={{ fontSize: "13px", color: "#0F172A", fontWeight: 700 }}>ตรวจเกณฑ์ 100%</strong>
                  </div>
                  <p className="font-reading" style={{ fontSize: "12px", color: "#64748B", margin: 0, lineHeight: 1.45 }}>
                    Hard Eligibility Gate กรองเงื่อนไขตายตัว 0% ข้อเสนอผิดเกณฑ์ นายหน้าตัดสินใจเอง
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
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
                  onClick={() => setActiveView("catalog")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 14px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#ffffff",
                    color: "#334155",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
                >
                  <span>🧭</span>
                  <span>เลือกดูเฉพาะฟีเจอร์</span>
                </button>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
                      padding: "8px 12px",
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
                    <span>🚀 เริ่มทัวร์แนะนำระบบ (10 ขั้นตอน)</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* ─── View 2: Feature Catalog / Jump to Feature ─── */
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
                  สารบัญฟีเจอร์ Broker Insight AI
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveView("welcome")}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "12.5px",
                    color: "#2563EB",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ← ย้อนกลับ
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
                คลิกเลือกโมดูลที่ต้องการให้ระบบพาไปชมและแนะนำการใช้งานแบบเจาะลึกได้ทันที:
              </p>

              {/* 6 Feature Catalog Cards Grid */}
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
                  <span>หรือเริ่มทัวร์ตามลำดับปกติ (10 ขั้นตอน)</span>
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
