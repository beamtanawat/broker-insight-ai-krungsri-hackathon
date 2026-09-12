"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useOnboardingTour } from "@/context/OnboardingTourContext";

export function GuidedTourSpotlight() {
  const {
    isTourActive,
    currentStep,
    currentStepIndex,
    steps,
    totalSteps,
    targetRect,
    isNavigating,
    nextStep,
    prevStep,
    jumpToStep,
    skipTour,
    openFeatureCatalog,
  } = useOnboardingTour();

  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });
  const [showStepDropdown, setShowStepDropdown] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleResize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowStepDropdown(false);
      }
    }
    if (showStepDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showStepDropdown]);

  // Keyboard navigation
  useEffect(() => {
    if (!isTourActive) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        skipTour();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nextStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevStep();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTourActive, nextStep, prevStep, skipTour]);

  // Compute Popover coordinates with smart auto-flip
  const popoverPosition = useMemo(() => {
    const isMobile = windowSize.width < 768;
    if (isMobile) {
      return {
        isMobile: true,
        style: {
          position: "fixed" as const,
          bottom: "16px",
          left: "12px",
          right: "12px",
          zIndex: 10002,
        },
      };
    }

    const cardWidth = 440;
    const cardHeight = 310;
    const offset = 16;

    // Default centered position if no target found or currently navigating
    if (!targetRect) {
      return {
        isMobile: false,
        style: {
          position: "fixed" as const,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10002,
          maxWidth: `${cardWidth}px`,
          width: "100%",
        },
      };
    }

    let placement = currentStep?.placement || "bottom";

    // Smart auto-flip if clipping viewport
    if (placement === "bottom" && targetRect.bottom + cardHeight + offset > windowSize.height - 20) {
      placement = "top";
    } else if (placement === "top" && targetRect.top - cardHeight - offset < 20) {
      placement = "bottom";
    } else if (placement === "right" && targetRect.right + cardWidth + offset > windowSize.width - 20) {
      placement = "left";
    } else if (placement === "left" && targetRect.left - cardWidth - offset < 20) {
      placement = "right";
    }

    let top = 0;
    let left = 0;

    if (placement === "bottom") {
      top = targetRect.bottom + offset;
      left = targetRect.left + (targetRect.width / 2) - (cardWidth / 2);
    } else if (placement === "top") {
      top = targetRect.top - cardHeight - offset;
      left = targetRect.left + (targetRect.width / 2) - (cardWidth / 2);
    } else if (placement === "left") {
      top = targetRect.top + (targetRect.height / 2) - (cardHeight / 2);
      left = targetRect.left - cardWidth - offset;
    } else if (placement === "right") {
      top = targetRect.top + (targetRect.height / 2) - (cardHeight / 2);
      left = targetRect.right + offset;
    }

    // Clamp within viewport margins
    top = Math.max(20, Math.min(windowSize.height - cardHeight - 20, top));
    left = Math.max(20, Math.min(windowSize.width - cardWidth - 20, left));

    return {
      isMobile: false,
      style: {
        position: "fixed" as const,
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 10002,
        width: `${cardWidth}px`,
      },
    };
  }, [windowSize, targetRect, currentStep]);

  if (!isTourActive || !currentStep) return null;

  const isLastStep = currentStepIndex === totalSteps - 1;
  const isFirstStep = currentStepIndex === 0;
  const nextStepObj = currentStepIndex + 1 < steps.length ? steps[currentStepIndex + 1] : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`ทัวร์ระบบ: ${currentStep.title}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        pointerEvents: "auto",
      }}
    >
      {/* ── Dimmed Backdrop with Spotlight Cutout ── */}
      {targetRect ? (
        <>
          {/* Spotlight Highlight Box around target with warm gold glow */}
          <div
            style={{
              position: "fixed",
              top: `${targetRect.top - 8}px`,
              left: `${targetRect.left - 8}px`,
              width: `${targetRect.width + 16}px`,
              height: `${targetRect.height + 16}px`,
              borderRadius: "12px",
              boxShadow: "0 0 0 9999px rgba(11, 30, 54, 0.75), 0 0 24px rgba(254, 203, 0, 0.6)",
              border: "2px solid #FECB00",
              pointerEvents: "none",
              zIndex: 10001,
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
        </>
      ) : (
        /* Full Backdrop when element is transitioning or centered */
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(11, 30, 54, 0.75)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 10001,
            pointerEvents: "none",
            transition: "opacity 0.25s ease",
          }}
        />
      )}

      {/* ── Guided Popover Card ── */}
      <div
        ref={popoverRef}
        style={{
          ...popoverPosition.style,
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid rgba(226, 232, 240, 0.95)",
          boxShadow: "0 24px 48px -12px rgba(11, 30, 54, 0.45), 0 4px 12px -2px rgba(11, 30, 54, 0.15)",
          overflow: "visible",
          animation: "scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Krungsri Brand Accent Strip */}
        <div
          style={{
            height: "5px",
            background: "linear-gradient(90deg, #FECB00 0%, #F59E0B 40%, #2563EB 100%)",
            borderTopLeftRadius: "16px",
            borderTopRightRadius: "16px",
          }}
        />

        <div style={{ padding: "20px 22px" }}>
          {/* Header Row: Step counter & Step selector dropdown & Skip button */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }} ref={dropdownRef}>
              {/* Interactive Step Dropdown Toggle */}
              <button
                type="button"
                onClick={() => setShowStepDropdown((prev) => !prev)}
                title="คลิกเพื่อเลือกข้ามไปยังขั้นตอนใดก็ได้"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#1D4ED8",
                  backgroundColor: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  padding: "3px 10px",
                  borderRadius: "999px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#DBEAFE")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#EFF6FF")}
              >
                <span>ขั้นตอนที่ {currentStepIndex + 1} จาก {totalSteps}</span>
                <span style={{ fontSize: "12px", color: "#3B82F6" }}>▾</span>
              </button>

              {/* Step Dropdown Menu */}
              {showStepDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "32px",
                    left: 0,
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #CBD5E1",
                    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.2)",
                    padding: "6px",
                    width: "280px",
                    maxHeight: "300px",
                    overflowY: "auto",
                    zIndex: 10005,
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                  className="custom-scrollbar"
                >
                  <div style={{ padding: "6px 8px", fontSize: "12px", fontWeight: 800, color: "#64748B", borderBottom: "1px solid #F1F5F9" }}>
                    เลือกฟีเจอร์ที่ต้องการเรียนรู้:
                  </div>
                  {steps.map((s, idx) => {
                    const isCurrent = idx === currentStepIndex;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setShowStepDropdown(false);
                          jumpToStep(idx);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "6px 8px",
                          borderRadius: "6px",
                          backgroundColor: isCurrent ? "#FEF3C7" : "transparent",
                          border: "none",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "background-color 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isCurrent) e.currentTarget.style.backgroundColor = "#F8FAFC";
                        }}
                        onMouseLeave={(e) => {
                          if (!isCurrent) e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <span style={{ fontSize: "14px" }}>{s.icon || "📌"}</span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: "12px", fontWeight: isCurrent ? 800 : 600, color: isCurrent ? "#92400E" : "#1E293B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {idx + 1}. {s.title}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Tag Pill */}
              {currentStep.tag && (
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#475569",
                    backgroundColor: "#F1F5F9",
                    padding: "3px 8px",
                    borderRadius: "6px",
                  }}
                >
                  {currentStep.tag}
                </span>
              )}
            </div>

            {/* Top Right Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={openFeatureCatalog}
                title="เปิดสารบัญดูฟีเจอร์ทั้งหมด"
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "12px",
                  color: "#2563EB",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>📑</span>
                <span>สารบัญฟีเจอร์</span>
              </button>

              <button
                type="button"
                onClick={skipTour}
                aria-label="ข้ามการแนะนำ"
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "12px",
                  color: "#94A3B8",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
              >
                ✕ ปิดคำแนะนำ
              </button>
            </div>
          </div>

          {/* Navigation Loading Notification */}
          {isNavigating && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "#FEF3C7",
                color: "#92400E",
                fontSize: "12px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "4px",
                marginBottom: "8px",
              }}
            >
              <span className="spin" style={{ display: "inline-block" }}>⚡</span>
              <span>กำลังสลับไปยังหน้าจอจริงและจัดตำแหน่ง...</span>
            </div>
          )}

          {/* Step Title with Icon & Final Step Headline */}
          {isLastStep && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "#DCFCE7",
                color: "#15803D",
                fontSize: "12px",
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: "999px",
                marginBottom: "8px",
              }}
            >
              <span>🎉 ยินดีด้วยครับ! ทำความรู้จักครบทุกฟีเจอร์แล้ว</span>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span style={{ fontSize: "22px", flexShrink: 0 }}>{currentStep.icon || "💡"}</span>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 800,
                color: "#0F172A",
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {currentStep.title}
            </h3>
          </div>

          {/* Step Description in Thai Reading Font */}
          <p
            className="font-reading"
            style={{
              fontFamily: "var(--font-reading-thai)",
              fontSize: "14px",
              color: "#334155",
              lineHeight: "var(--lh-reading)",
              margin: "0 0 12px 0",
            }}
          >
            {isLastStep
              ? `${currentStep.description} คุณได้ทำความรู้จักฟีเจอร์สำคัญครบถ้วนแล้ว พร้อมเริ่มต้นใช้งานจริงได้อย่างมั่นใจครับ!`
              : currentStep.description}
          </p>

          {/* Key Highlight Pill */}
          {currentStep.keyHighlight && (
            <div
              style={{
                backgroundColor: "#FFFBEB",
                border: "1px solid #FDE68A",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "12.5px",
                color: "#92400E",
                fontWeight: 600,
                lineHeight: 1.45,
                marginBottom: "16px",
                display: "flex",
                alignItems: "flex-start",
                gap: "6px",
              }}
            >
              <span>{currentStep.keyHighlight}</span>
            </div>
          )}

          {/* Dots Progress Track */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              marginBottom: "16px",
            }}
          >
            {Array.from({ length: totalSteps }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => jumpToStep(i)}
                title={`ข้ามไปยังขั้นตอนที่ ${i + 1}`}
                style={{
                  width: i === currentStepIndex ? "22px" : "7px",
                  height: "7px",
                  borderRadius: "999px",
                  backgroundColor: i === currentStepIndex ? "#FECB00" : "#CBD5E1",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            ))}
          </div>

          {/* Navigation Controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: "12px",
              borderTop: "1px solid #F1F5F9",
            }}
          >
            <div>
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={prevStep}
                  style={{
                    padding: "7px 16px",
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
                  ← ย้อนกลับ
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                id="tour-btn-next"
                onClick={nextStep}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: isLastStep ? "#16A34A" : "#2563EB",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: isLastStep
                    ? "0 3px 10px rgba(22, 163, 74, 0.35)"
                    : "0 3px 10px rgba(37, 99, 235, 0.35)",
                  transition: "all 0.15s ease",
                  maxWidth: "280px",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = "brightness(1.1)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = "none";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {isLastStep ? "เริ่มใช้งานจริง" : nextStepObj ? `ฟีเจอร์ถัดไป: ${nextStepObj.title}` : "ถัดไป"}
                </span>
                <span aria-hidden="true">{isLastStep ? "✓" : "→"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
