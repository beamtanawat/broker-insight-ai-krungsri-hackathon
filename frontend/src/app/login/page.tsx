"use client";
import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { setTokens } from "@/lib/auth";
import { Card, Badge, Button, Alert } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("broker@demo.local");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const tokens = await api.auth.login(email, password);
      setTokens(tokens.access_token, tokens.refresh_token);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลหรือรหัสผ่าน");
    } finally {
      setLoading(false);
    }
  }

  function handleQuickFill(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("demo1234");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-app)",
        padding: "20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "440px" }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "var(--primary-700)",
              color: "white",
              fontSize: "24px",
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "12px",
              boxShadow: "var(--shadow-md)",
            }}
          >
            ⚡
          </div>
          <h1 style={{ fontSize: "var(--fs-2xl)", fontWeight: 800, color: "var(--slate-900)", margin: 0 }}>
            Broker Insight AI
          </h1>
          <p style={{ fontSize: "var(--fs-sm)", color: "var(--slate-500)", marginTop: "4px" }}>
            ระบบผู้ช่วยอัจฉริยะและการจัดลำดับความสำคัญลูกค้า (Pilot Workspace)
          </p>
        </div>

        {/* Login Card */}
        <Card elevated style={{ backgroundColor: "var(--white)" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {error && (
              <Alert variant="danger" style={{ fontSize: "var(--fs-xs)" }}>
                {error}
              </Alert>
            )}

            <div>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  fontSize: "var(--fs-xs)",
                  fontWeight: 700,
                  color: "var(--slate-700)",
                  marginBottom: "6px",
                }}
              >
                อีเมล (Email)
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="broker@demo.local"
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 12px",
                  fontSize: "var(--fs-sm)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "var(--slate-50)",
                  color: "var(--slate-900)",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  fontSize: "var(--fs-xs)",
                  fontWeight: 700,
                  color: "var(--slate-700)",
                  marginBottom: "6px",
                }}
              >
                รหัสผ่าน (Password)
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 12px",
                  fontSize: "var(--fs-sm)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "var(--slate-50)",
                  color: "var(--slate-900)",
                  outline: "none",
                }}
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              type="submit"
              isLoading={loading}
              style={{ width: "100%", marginTop: "4px" }}
            >
              เข้าสู่ระบบ (Sign In)
            </Button>
          </form>

          {/* Quick-fill Demo Roles */}
          <div
            style={{
              marginTop: "20px",
              paddingTop: "16px",
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                fontSize: "var(--fs-xs)",
                fontWeight: 700,
                color: "var(--slate-500)",
                marginBottom: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              เลือกบัญชีสาธิต (Quick Demo Roles):
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {[
                { email: "broker@demo.local", role: "broker", label: "นายหน้าประกัน (Broker)", variant: "info" as const },
                { email: "manager@demo.local", role: "manager", label: "ผู้จัดการทีม (Manager)", variant: "warning" as const },
                { email: "admin@demo.local", role: "admin", label: "ผู้ดูแลระบบ (Admin)", variant: "danger" as const },
              ].map((item) => (
                <button
                  key={item.email}
                  type="button"
                  onClick={() => handleQuickFill(item.email)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                    backgroundColor: "var(--slate-50)",
                    fontSize: "var(--fs-xs)",
                    textAlign: "left",
                    transition: "all var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "var(--primary-50)";
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--primary-500)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "var(--slate-50)";
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--slate-800)" }}>{item.label}</div>
                    <div style={{ color: "var(--slate-500)" }}>{item.email}</div>
                  </div>
                  <Badge variant={item.variant} size="sm">
                    {item.role}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Security & Sandbox Notice */}
        <div style={{ textAlign: "center", marginTop: "16px", fontSize: "var(--fs-xs)", color: "var(--slate-500)" }}>
          🔒 ระบบทดสอบนำร่อง (Pilot Sandbox) · ข้อมูลจำลองสังเคราะห์ปลอดภัย (Zero PII Leak)
        </div>

      </div>
    </div>
  );
}
