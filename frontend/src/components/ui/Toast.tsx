"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastVariant = "success" | "warning" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  title?: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  toast: (options: { message: string; title?: string; variant?: ToastVariant; duration?: number }) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const noop = () => {};
const fallbackContext: ToastContextType = {
  toast: noop,
  success: noop,
  error: noop,
  warning: noop,
  info: noop,
  dismiss: noop,
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return fallbackContext;
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({
      message,
      title,
      variant = "success",
      duration = 4000,
    }: {
      message: string;
      title?: string;
      variant?: ToastVariant;
      duration?: number;
    }) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastItem = { id, message, title, variant, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  const success = useCallback((message: string, title?: string) => addToast({ message, title, variant: "success" }), [addToast]);
  const error = useCallback((message: string, title?: string) => addToast({ message, title, variant: "error" }), [addToast]);
  const warning = useCallback((message: string, title?: string) => addToast({ message, title, variant: "warning" }), [addToast]);
  const info = useCallback((message: string, title?: string) => addToast({ message, title, variant: "info" }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warning, info, dismiss }}>
      {children}

      {/* Floating Toast Container */}
      <div
        id="toast-container"
        aria-live="polite"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          pointerEvents: "none",
          maxWidth: "400px",
          width: "calc(100vw - 48px)",
        }}
      >
        {toasts.map((t) => {
          const config = {
            success: {
              borderLeft: "4px solid #10b981",
              icon: "✅",
              badgeBg: "#ecfdf5",
              badgeColor: "#065f46",
              title: t.title || "ดำเนินการสำเร็จ",
            },
            warning: {
              borderLeft: "4px solid #f59e0b",
              icon: "⚠️",
              badgeBg: "#fffbeb",
              badgeColor: "#92400e",
              title: t.title || "ข้อควรระวัง",
            },
            error: {
              borderLeft: "4px solid #ef4444",
              icon: "❌",
              badgeBg: "#fef2f2",
              badgeColor: "#991b1b",
              title: t.title || "เกิดข้อผิดพลาด",
            },
            info: {
              borderLeft: "4px solid var(--krungsri-yellow)",
              icon: "💡",
              badgeBg: "#fef9c3",
              badgeColor: "var(--krungsri-navy)",
              title: t.title || "ข้อมูลระบบ",
            },
          }[t.variant];

          return (
            <div
              key={t.id}
              role="status"
              className="hover-lift"
              style={{
                pointerEvents: "auto",
                backgroundColor: "#ffffff",
                borderRadius: "var(--radius-lg)",
                boxShadow: "0 10px 30px -5px rgba(11, 30, 54, 0.2), 0 4px 12px -2px rgba(11, 30, 54, 0.1)",
                border: "1px solid var(--border-subtle)",
                borderLeft: config.borderLeft,
                padding: "14px 16px",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: "18px", lineHeight: 1.2, marginTop: "2px" }}>{config.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <strong style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--slate-900)" }}>
                    {config.title}
                  </strong>
                  <button
                    type="button"
                    onClick={() => dismiss(t.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--slate-400)",
                      cursor: "pointer",
                      fontSize: "14px",
                      lineHeight: 1,
                      padding: "2px 4px",
                      borderRadius: "4px",
                    }}
                    aria-label="ปิดการแจ้งเตือน"
                  >
                    ✕
                  </button>
                </div>
                <div
                  style={{
                    fontSize: "var(--fs-xs)",
                    color: "var(--slate-600)",
                    marginTop: "4px",
                    lineHeight: 1.45,
                    wordBreak: "break-word",
                  }}
                >
                  {t.message}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
