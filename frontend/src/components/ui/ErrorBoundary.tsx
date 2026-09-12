"use client";
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard";
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 16px",
            backgroundColor: "var(--bg-app, #F8FAFC)",
          }}
        >
          <div
            style={{
              maxWidth: "520px",
              width: "100%",
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 10px 25px -5px rgba(11, 30, 54, 0.1), 0 8px 10px -6px rgba(11, 30, 54, 0.05)",
              padding: "32px 28px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "#FEF2F2",
                color: "#DC2626",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "26px",
                marginBottom: "16px",
                boxShadow: "0 2px 8px rgba(220, 38, 38, 0.15)",
              }}
            >
              ⚠️
            </div>

            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "#4a3837",
                marginBottom: "8px",
                fontFamily: "var(--font-ui-thai)",
              }}
            >
              เกิดข้อขัดข้องชั่วคราวในการแสดงผล
            </h2>

            <p
              className="font-reading"
              style={{
                fontSize: "0.875rem",
                color: "#64748B",
                lineHeight: 1.6,
                marginBottom: "24px",
                fontFamily: "var(--font-reading-thai)",
              }}
            >
              ระบบไม่สามารถประมวลผลข้อมูลในส่วนนี้ได้ตามปกติ ข้อมูลของคุณยังคงปลอดภัย
              กรุณาลองรีเฟรชหน้าจอใหม่อีกครั้ง หรือกลับสู่หน้าแดชบอร์ดหลัก
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "var(--krungsri-yellow, #FECB00)",
                  color: "#3b2c2b",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(254, 203, 0, 0.4)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>🔄</span>
                <span>โหลดหน้านี้ใหม่</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  backgroundColor: "#ffffff",
                  color: "#334155",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>🏠</span>
                <span>กลับสู่แดชบอร์ด</span>
              </button>
            </div>

            {process.env.NODE_ENV !== "production" && this.state.error && (
              <div
                style={{
                  marginTop: "24px",
                  padding: "12px",
                  backgroundColor: "#F8FAFC",
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  textAlign: "left",
                  fontSize: "12px",
                  color: "#991B1B",
                  fontFamily: "monospace",
                  maxHeight: "120px",
                  overflowY: "auto",
                }}
              >
                <strong>Debug Info:</strong> {this.state.error.toString()}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
