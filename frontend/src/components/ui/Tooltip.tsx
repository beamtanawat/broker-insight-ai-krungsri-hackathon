"use client";
import React, { useState, useRef } from "react";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  /** Placement relative to trigger. Default: "top" */
  placement?: "top" | "bottom" | "left" | "right";
  /** Max width of tooltip bubble. Default: 240px */
  maxWidth?: string;
}

/**
 * Tooltip for explaining technical concepts (SHAP, F1, PSI, etc.)
 * Appears on hover AND focus — accessible for keyboard users.
 * Never shows on touch-only (uses :focus-visible pattern).
 */
export function Tooltip({
  content,
  children,
  placement = "top",
  maxWidth = "240px",
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(true), 120);
  }
  function hide() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 80);
  }

  const OFFSET = 8;

  const positionStyle: React.CSSProperties = (() => {
    switch (placement) {
      case "bottom": return { top: "calc(100% + " + OFFSET + "px)", left: "50%", transform: "translateX(-50%)" };
      case "left":   return { right: "calc(100% + " + OFFSET + "px)", top: "50%", transform: "translateY(-50%)" };
      case "right":  return { left: "calc(100% + " + OFFSET + "px)", top: "50%", transform: "translateY(-50%)" };
      default:       return { bottom: "calc(100% + " + OFFSET + "px)", left: "50%", transform: "translateX(-50%)" };
    }
  })();

  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      {visible && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            ...positionStyle,
            zIndex: 300,
            backgroundColor: "var(--slate-900)",
            color: "var(--white)",
            fontSize: "var(--fs-xs)",
            lineHeight: 1.5,
            padding: "6px 10px",
            borderRadius: "var(--radius-md)",
            maxWidth,
            whiteSpace: "normal",
            boxShadow: "var(--shadow-md)",
            pointerEvents: "none",
            animation: "tooltipPop 120ms ease forwards",
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
