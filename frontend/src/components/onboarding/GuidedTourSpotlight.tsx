"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useOnboardingTour } from "@/context/OnboardingTourContext";

export function GuidedTourSpotlight() {
  const {
    isTourActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    targetRect,
    nextStep,
    prevStep,
    skipTour,
  } = useOnboardingTour();

  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleResize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  // Compute Popover coordinates
  const popoverPosition = useMemo(() => {
    const isMobile = windowSize.width < 768;
    if (isMobile) {
      return {
        isMobile: true,
        style: {
          position: "fixed" as const,
          bottom: "16px",
          left: "16px",
          right: "16px",
          zIndex: 10002,
        },
      };
    }

    // Default centered position if no target found
    if (!targetRect) {
      return {
        isMobile: false,
        style: {
          position: "fixed" as const,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10002,
          maxWidth: "420px",
          width: "100%",
        },
      };
    }

    const cardWidth = 400;
    const cardHeight = 240;
    const offset = 14;
    const placement = currentStep?.placement || "bottom";

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

    // Clamp within viewport
    top = Math.max(16, Math.min(windowSize.height - cardHeight - 16, top));
    left = Math.max(16, Math.min(windowSize.width - cardWidth - 16, left));

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
          {/* Spotlight Highlight Box around target */}
          <div
            style={{
              position: "fixed",
              top: `${targetRect.top - 6}px`,
              left: `${targetRect.left - 6}px`,
              width: `${targetRect.width + 12}px`,
              height: `${targetRect.height + 12}px`,
              borderRadius: "10px",
              boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.68), 0 0 20px rgba(254, 203, 0, 0.5)",
              border: "2px solid #FECB00",
              pointerEvents: "none",
              zIndex: 10001,
              transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
        </>
      ) : (
        /* Full Backdrop when element is centered / fallback */
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.68)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 10001,
            pointerEvents: "none",
          }}
        />
      )}

      {/* ── Guided Popover Card ── */}
      <div
        ref={popoverRef}
        style={{
          ...popoverPosition.style,
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          border: "1px solid rgba(226, 232, 240, 0.9)",
          boxShadow: "0 20px 35px -8px rgba(11, 30, 54, 0.3), 0 4px 10px -2px rgba(11, 30, 54, 0.1)",
          overflow: "hidden",
          animation: "scaleUp 0.2s ease-out",
        }}
      >
        {/* Yellow Top Strip */}
        <div
          style={{
            height: "4px",
            backgroundColor: "#FECB00",
          }}
        />

        <div style={{ padding: "18px 20px" }}>
          {/* Header Row: Step counter & Skip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#2563EB",
                  backgroundColor: "#EFF6FF",
                  padding: "2px 8px",
                  borderRadius: "999px",
                }}
              >
                ขั้นตอนที่ {currentStepIndex + 1} จาก {totalSteps}
              </span>
              {currentStep.tag && (
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#475569",
                    backgroundColor: "#F1F5F9",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  {currentStep.tag}
                </span>
              )}
            </div>

            <button
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
              ข้ามการแนะนำ
            </button>
          </div>

          {/* Step Title */}
          <h3
            style={{
              fontSize: "17px",
              fontWeight: 800,
              color: "#0F172A",
              margin: "0 0 8px 0",
              lineHeight: 1.3,
            }}
          >
            {currentStep.title}
          </h3>

          {/* Step Description — Thai Reading Font */}
          <p
            className="font-reading"
            style={{
              fontFamily: "var(--font-reading-thai)",
              fontSize: "14px",
              color: "#475569",
              lineHeight: "var(--lh-reading)",
              margin: "0 0 16px 0",
            }}
          >
            {currentStep.description}
          </p>

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
              <span
                key={i}
                style={{
                  width: i === currentStepIndex ? "16px" : "6px",
                  height: "6px",
                  borderRadius: "999px",
                  backgroundColor: i === currentStepIndex ? "#FECB00" : "#CBD5E1",
                  transition: "all 0.2s ease",
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
              paddingTop: "10px",
              borderTop: "1px solid #F1F5F9",
            }}
          >
            <div>
              {!isFirstStep && (
                <button
                  onClick={prevStep}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#ffffff",
                    color: "#334155",
                    fontSize: "13px",
                    fontWeight: 600,
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
                onClick={nextStep}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 18px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: isLastStep ? "#16A34A" : "#2563EB",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: isLastStep
                    ? "0 2px 6px rgba(22, 163, 74, 0.3)"
                    : "0 2px 6px rgba(37, 99, 235, 0.3)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = "brightness(1.08)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = "none";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <span>{isLastStep ? "เริ่มใช้งาน" : "ถัดไป"}</span>
                <span aria-hidden="true">{isLastStep ? "✓" : "→"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
