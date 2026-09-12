"use client";
import React, { useState } from "react";

interface SmartphoneMockupProps {
  children: React.ReactNode;
  onOpenConsult?: () => void;
  title?: string;
  header?: React.ReactNode;
  bottomBar?: React.ReactNode;
  contentPadding?: string;
  bgScreen?: string;
}

export function SmartphoneMockup({
  children,
  onOpenConsult,
  title = "Krungsri My Protection",
  header,
  bottomBar,
  contentPadding,
  bgScreen = "#F8FAFC",
}: SmartphoneMockupProps) {
  const [liked, setLiked] = useState(false);
  const [dynamicIslandExpanded, setDynamicIslandExpanded] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px 0 36px",
      }}
    >
      {/* Device Model Label Pill */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          backgroundColor: "#0f172a",
          color: "#94a3b8",
          fontSize: "12px",
          fontWeight: 700,
          padding: "4px 12px",
          borderRadius: "999px",
          marginBottom: "14px",
          letterSpacing: "0.03em",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        }}
      >
        <span></span>
        <span>iPhone 17 Pro Max</span>
        <span style={{ color: "#38bdf8" }}>•</span>
        <span style={{ color: "#cbd5e1" }}>Natural Titanium</span>
      </div>

      {/* Outer iPhone Chassis (Natural Titanium Aerospace Rim) */}
      <div
        style={{
          position: "relative",
          width: "426px",
          height: "870px",
          maxHeight: "calc(100vh - 140px)",
          backgroundColor: "#16171a",
          borderRadius: "58px",
          padding: "10px",
          border: "2px solid #334155",
          boxShadow:
            "0 40px 80px -15px rgba(0, 0, 0, 0.6), 0 20px 40px -20px rgba(11, 30, 54, 0.4), inset 0 0 0 2px rgba(255, 255, 255, 0.18), inset 0 0 10px rgba(0, 0, 0, 0.8)",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        {/* Antenna Band 1 (Top Left) */}
        <div
          style={{
            position: "absolute",
            left: "-2px",
            top: "70px",
            width: "3px",
            height: "4px",
            backgroundColor: "#475569",
          }}
        />

        {/* Physical Button: Action Button (Left Top) */}
        <div
          style={{
            position: "absolute",
            left: "-13px",
            top: "98px",
            width: "4px",
            height: "28px",
            backgroundColor: "#2a2c31",
            borderRadius: "3px 0 0 3px",
            boxShadow: "inset -1px 0 1px rgba(255, 255, 255, 0.3), -1px 0 2px rgba(0,0,0,0.4)",
          }}
          title="Action Button"
        />

        {/* Physical Button: Volume Up (Left Middle) */}
        <div
          style={{
            position: "absolute",
            left: "-13px",
            top: "142px",
            width: "4px",
            height: "52px",
            backgroundColor: "#2a2c31",
            borderRadius: "3px 0 0 3px",
            boxShadow: "inset -1px 0 1px rgba(255, 255, 255, 0.3), -1px 0 2px rgba(0,0,0,0.4)",
          }}
          title="Volume Up"
        />

        {/* Physical Button: Volume Down (Left Middle) */}
        <div
          style={{
            position: "absolute",
            left: "-13px",
            top: "206px",
            width: "4px",
            height: "52px",
            backgroundColor: "#2a2c31",
            borderRadius: "3px 0 0 3px",
            boxShadow: "inset -1px 0 1px rgba(255, 255, 255, 0.3), -1px 0 2px rgba(0,0,0,0.4)",
          }}
          title="Volume Down"
        />

        {/* Antenna Band 2 (Bottom Left) */}
        <div
          style={{
            position: "absolute",
            left: "-2px",
            bottom: "120px",
            width: "3px",
            height: "4px",
            backgroundColor: "#475569",
          }}
        />

        {/* Physical Button: Power / Siri Side Button (Right) */}
        <div
          style={{
            position: "absolute",
            right: "-13px",
            top: "160px",
            width: "4px",
            height: "76px",
            backgroundColor: "#2a2c31",
            borderRadius: "0 3px 3px 0",
            boxShadow: "inset 1px 0 1px rgba(255, 255, 255, 0.3), 1px 0 2px rgba(0,0,0,0.4)",
          }}
          title="Side Button / Siri"
        />

        {/* Physical Button: Camera Control Button (Right Bottom - New on iPhone 16/17 Pro) */}
        <div
          style={{
            position: "absolute",
            right: "-13px",
            bottom: "160px",
            width: "4px",
            height: "48px",
            backgroundColor: "#334155",
            borderRadius: "0 3px 3px 0",
            boxShadow: "inset 1px 0 1px rgba(255, 255, 255, 0.4), 1px 0 2px rgba(0,0,0,0.5)",
          }}
          title="Camera Control"
        />

        {/* Inner Screen Display (Super Retina XDR OLED Display) */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            backgroundColor: "#f8fafc",
            borderRadius: "48px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.15)",
          }}
        >
          {/* iOS Status Bar + Centered Dynamic Island */}
          <div
            style={{
              height: "48px",
              backgroundColor: "rgba(11, 30, 54, 0.96)",
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0 24px",
              fontSize: "12px",
              fontWeight: 700,
              zIndex: 40,
              flexShrink: 0,
              position: "relative",
              borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            {/* Time (09:41) */}
            <div style={{ width: "60px", letterSpacing: "-0.02em", fontSize: "13px", fontWeight: 800 }}>
              09:41
            </div>

            {/* Dynamic Island Capsule (Centered) */}
            <div
              onClick={() => setDynamicIslandExpanded(!dynamicIslandExpanded)}
              style={{
                position: "absolute",
                top: "10px",
                left: "50%",
                transform: "translateX(-50%)",
                width: dynamicIslandExpanded ? "190px" : "122px",
                height: "28px",
                backgroundColor: "#000000",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 10px",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.6), inset 0 0 1px rgba(255, 255, 255, 0.3)",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                zIndex: 50,
              }}
              title="Dynamic Island (คลิกเพื่อขยาย)"
            >
              {/* Left: Camera Lens / TrueDepth Dot */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: "#111827",
                    boxShadow: "inset 0 0 2px #38bdf8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: "4px",
                      height: "4px",
                      borderRadius: "50%",
                      backgroundColor: "#0369a1",
                    }}
                  />
                </div>
                {dynamicIslandExpanded && (
                  <span style={{ fontSize: "12px", color: "var(--krungsri-yellow)", fontWeight: 700 }}>
                    My Protection
                  </span>
                )}
              </div>

              {/* Right: Face ID sensor dot or Shield */}
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                {dynamicIslandExpanded ? (
                  <span style={{ fontSize: "12px" }}>🛡️ Live</span>
                ) : (
                  <div
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      backgroundColor: "#10b981",
                      boxShadow: "0 0 4px #10b981",
                    }}
                  />
                )}
              </div>
            </div>

            {/* Right: Network & Battery Indicators */}
            <div
              style={{
                width: "65px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "5px",
                fontSize: "12px",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 800 }}>5G</span>
              <span>📶</span>
              {/* iOS Battery Capsule */}
              <div
                style={{
                  width: "22px",
                  height: "11px",
                  border: "1.5px solid #ffffff",
                  borderRadius: "3.5px",
                  padding: "1px",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#10b981",
                    borderRadius: "1.5px",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    right: "-3.5px",
                    top: "2.5px",
                    width: "1.5px",
                    height: "4px",
                    backgroundColor: "#ffffff",
                    borderRadius: "0 1px 1px 0",
                  }}
                />
              </div>
            </div>
          </div>

          {/* App Top Brand Header inside Phone Screen */}
          {header !== undefined ? (
            header
          ) : (
            <div
              style={{
                padding: "8px 14px",
                backgroundColor: "#0b1e36",
                color: "#ffffff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                zIndex: 30,
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "7px",
                    backgroundColor: "var(--krungsri-yellow)",
                    color: "#0b1e36",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: 900,
                    boxShadow: "0 0 8px rgba(254, 203, 0, 0.4)",
                  }}
                >
                  K
                </div>
                <div>
                  <span style={{ fontSize: "12px", fontWeight: 800 }}>{title}</span>
                </div>
              </div>
              <span
                style={{
                  fontSize: "12px",
                  backgroundColor: "rgba(254, 203, 0, 0.18)",
                  color: "var(--krungsri-yellow)",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  fontWeight: 800,
                  border: "1px solid rgba(254, 203, 0, 0.3)",
                }}
              >
                KMA Gen Z
              </span>
            </div>
          )}

          {/* Scrollable Screen Content */}
          <div
            className="custom-scrollbar"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: contentPadding !== undefined ? contentPadding : "12px 10px 16px",
              backgroundColor: bgScreen,
              scrollBehavior: "smooth",
            }}
          >
            {children}
          </div>

          {/* Bottom Floating Bar / Navigation */}
          {bottomBar !== undefined ? (
            bottomBar
          ) : (
            <div
              style={{
                padding: "8px 14px 4px",
                backgroundColor: "rgba(255, 255, 255, 0.94)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                borderTop: "1px solid rgba(11, 30, 54, 0.08)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexShrink: 0,
                zIndex: 35,
              }}
            >
              {/* Pill Search / Quick Message Bar */}
              <div
                onClick={onOpenConsult}
                style={{
                  flex: 1,
                  backgroundColor: "rgba(11, 30, 54, 0.05)",
                  border: "1px solid rgba(11, 30, 54, 0.12)",
                  borderRadius: "9999px",
                  padding: "7px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  transition: "background-color 0.15s ease",
                }}
              >
                <span style={{ fontSize: "12px", color: "var(--slate-600)", fontWeight: 500 }}>
                  💬 ปรึกษาคุณสมชาย (โบรกเกอร์)...
                </span>
                <span style={{ fontSize: "14px" }}>😊</span>
              </div>

              {/* Heart / Favorite Button (Matching user's drawing) */}
              <button
                onClick={() => setLiked(!liked)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: liked ? "#fee2e2" : "rgba(11, 30, 54, 0.04)",
                  border: liked ? "1px solid #fca5a5" : "1px solid rgba(11, 30, 54, 0.1)",
                  color: liked ? "#dc2626" : "var(--slate-600)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
                title="บันทึกแผนความคุ้มครองที่ถูกใจ"
              >
                {liked ? "❤️" : "♡"}
              </button>
            </div>
          )}

          {/* iOS Home Swipe Bar (Bottom) */}
          <div
            style={{
              height: "18px",
              backgroundColor: bottomBar ? "#0B1E36" : "#ffffff",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "134px",
                height: "4.5px",
                backgroundColor: bottomBar ? "rgba(255,255,255,0.4)" : "#0f172a",
                borderRadius: "999px",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
