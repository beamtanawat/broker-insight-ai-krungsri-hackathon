"use client";
import React, { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

/**
 * Enhanced Modal with:
 * - Focus trap (Tab/Shift+Tab stays inside)
 * - aria-modal, aria-labelledby for screen readers
 * - Escape key to close
 * - Fade-in animation
 */
export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "540px",
}: ModalProps) {
  const titleId = React.useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }

      // Focus trap
      if (e.key === "Tab" && containerRef.current) {
        const focusable = containerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
        } else {
          if (document.activeElement === last)  { e.preventDefault(); first?.focus(); }
        }
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => firstFocusableRef.current?.focus());
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "var(--space-5)",
        animation: "fadeIn var(--motion-fast) ease",
      }}
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
          width: "100%",
          maxWidth,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "var(--space-4) var(--space-5)",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3
              id={titleId}
              style={{
                margin: 0,
                fontSize: "var(--fs-lg)",
                fontWeight: 700,
                color: "var(--slate-900)",
              }}
            >
              {title}
            </h3>
            {subtitle && (
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "2px" }}>
                {subtitle}
              </div>
            )}
          </div>
          <button
            ref={firstFocusableRef}
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              color: "var(--slate-400)",
              fontSize: "18px",
              borderRadius: "var(--radius-sm)",
              lineHeight: 1,
              transition: "all var(--motion-fast)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "var(--slate-100)";
              (e.currentTarget as HTMLElement).style.color = "var(--slate-700)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--slate-400)";
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "var(--space-5)", overflowY: "auto", flex: 1 }}>{children}</div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: "var(--space-3) var(--space-5)",
              backgroundColor: "var(--slate-50)",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "var(--space-2)",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
