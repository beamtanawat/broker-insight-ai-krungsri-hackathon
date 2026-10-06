"use client";
import React, { useEffect, useRef } from "react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  width?: string;
}

/**
 * Right-side drawer for AI details, customer history, technical evidence.
 * Preserves page context — never full-screen.
 */
export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = "480px",
}: DrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
      // Focus the close button on open
      requestAnimationFrame(() => closeButtonRef.current?.focus());
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.45)",
          backdropFilter: "blur(1px)",
          zIndex: 200,
          animation: "fadeIn var(--motion-fast) ease",
        }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width,
          maxWidth: "100vw",
          backgroundColor: "var(--bg-surface)",
          borderLeft: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-lg)",
          zIndex: 201,
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight var(--motion-base) cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "var(--space-4) var(--space-5)",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "var(--fs-md)",
                fontWeight: 700,
                color: "var(--slate-900)",
                lineHeight: 1.3,
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "2px" }}>
                {subtitle}
              </div>
            )}
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close panel"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "var(--radius-md)",
              color: "var(--slate-400)",
              fontSize: "18px",
              transition: "all var(--motion-fast)",
              flexShrink: 0,
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
        <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-5)" }}>
          {children}
        </div>
      </div>
    </>
  );
}
