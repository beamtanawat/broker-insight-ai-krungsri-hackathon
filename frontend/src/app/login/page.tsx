"use client";

import React, { useState, useEffect, FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { isAuthenticated, setTokens } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  // Authentication & Form States
  const [email, setEmail] = useState("broker@demo.local");
  const [password, setPassword] = useState("demo1234");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function handleLogin(targetEmail: string, targetPass: string) {
    setError("");
    setLoading(true);
    try {
      const tokens = await api.auth.login(targetEmail, targetPass);
      setTokens(tokens.access_token, tokens.refresh_token);
      try {
        sessionStorage.setItem("trigger_welcome_onboarding", "true");
        localStorage.removeItem("broker-insight-onboarding-completed");
        localStorage.removeItem("broker-insight-onboarding-dismissed");
        localStorage.removeItem("broker_insight_onboarding_state");
        localStorage.removeItem("broker-insight-onboarding-state");
        localStorage.removeItem("broker-insight-onboarding-current-step");
      } catch {}
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบข้อมูลอีกครั้ง"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    handleLogin(email, password);
  }

  function selectDemoAccount(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("demo1234");
    setError("");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        backgroundColor: "#ffffff",
        fontFamily: "var(--font-ui-thai, inherit)",
      }}
    >
      {/* =========================================================================
          LEFT SIDE: PREMIUM EXECUTIVE BRAND EXPERIENCE (55% on Desktop)
          Bangkok Financial District at Dusk with Quiet Sophistication
          ========================================================================= */}
      <section
        aria-label="Broker Insight AI — ข้อมูลระบบและสถาปัตยกรรม"
        className="login-brand-panel"
        style={{
          flex: "1 1 55%",
          width: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "clamp(32px, 5vw, 72px) clamp(20px, 5vw, 64px)",
          color: "#ffffff",
          overflow: "hidden",
        }}
      >
        {/* Background Skyline Image with Twilight Gradient Overlay */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
          }}
        >
          <Image
            src="/bangkok-financial-dusk.jpg"
            alt="Bangkok Financial District at Twilight"
            fill
            priority
            quality={90}
            style={{
              objectFit: "cover",
              objectPosition: "center 35%",
            }}
          />
          {/* Deep Navy Corporate Filter Overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(6, 18, 36, 0.82) 0%, rgba(6, 18, 36, 0.72) 40%, rgba(6, 18, 36, 0.94) 100%)",
            }}
          />
          {/* Subtle Golden Ambient Edge Glow */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "2px",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(254, 203, 0, 0.4) 50%, transparent 100%)",
            }}
          />
        </div>

        {/* Top Brand Identity */}
        <div style={{ position: "relative", zIndex: 2 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "6px 14px",
                borderRadius: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.96)",
                boxShadow: "0 6px 20px rgba(0, 0, 0, 0.35)",
              }}
            >
              <Image
                src="/broker-insight-logo.png"
                alt="Broker Insight AI Logo"
                width={142}
                height={34}
                style={{ height: "34px", width: "auto", display: "block" }}
                priority
              />
            </div>

            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#FECB00",
                backgroundColor: "rgba(254, 203, 0, 0.12)",
                border: "1px solid rgba(254, 203, 0, 0.28)",
                padding: "4px 10px",
                borderRadius: "6px",
                letterSpacing: "0.04em",
              }}
            >
              Krungsri Hackathon Edition
            </div>
          </div>

          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#94a3b8",
              marginBottom: "12px",
            }}
          >
            AI-Powered Decision Support Workspace for Insurance Brokers
          </div>

          <h1
            style={{
              fontSize: "clamp(1.85rem, 3.2vw, 2.75rem)",
              fontWeight: 800,
              lineHeight: 1.25,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              margin: "0 0 16px 0",
              maxWidth: "560px",
            }}
          >
            วิเคราะห์ลูกค้าอย่างตรงจุด
            <br />
            <span style={{ color: "#FECB00" }}>ตัดสินใจได้อย่างมั่นใจ</span>
          </h1>

          <p
            style={{
              fontFamily: "var(--font-reading-thai, inherit)",
              fontSize: "15px",
              lineHeight: 1.7,
              color: "#cbd5e1",
              maxWidth: "520px",
              margin: 0,
            }}
          >
            ระบบผู้ช่วยอัจฉริยะสำหรับนายหน้าประกันภัยธนาคารกรุงศรี
            ช่วยวิเคราะห์ความต้องการ คัดกรองโอกาส และอธิบายเหตุผลอย่างโปร่งใส
            เพื่อส่งมอบคำแนะนำที่ตรงใจลูกค้าที่สุด
          </p>
        </div>

        {/* Center: Premium Translucent Information Card */}
        <div
          className="login-info-card"
          style={{
            position: "relative",
            zIndex: 2,
            margin: "32px 0",
            maxWidth: "520px",
          }}
        >
          <div
            style={{
              padding: "24px 28px",
              borderRadius: "16px",
              backgroundColor: "rgba(15, 23, 42, 0.55)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                paddingBottom: "12px",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  color: "#f8fafc",
                }}
              >
                4 มิติการวิเคราะห์ข้อมูลลูกค้า (Customer Intelligence)
              </span>
              <span
                style={{
                  fontSize: "12px",
                  color: "#FECB00",
                  fontWeight: 600,
                }}
              >
                Explainable AI
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "16px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#FECB00",
                    marginBottom: "3px",
                  }}
                >
                  ลำดับความสำคัญ (Priority)
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-reading-thai, inherit)",
                    fontSize: "13px",
                    color: "#94a3b8",
                    lineHeight: 1.5,
                  }}
                >
                  คัดกรองลูกค้าที่มีความจำเป็นเร่งด่วนและมีโอกาสตอบรับสูงสุด
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#38bdf8",
                    marginBottom: "3px",
                  }}
                >
                  จังหวะเวลาที่ควรติดต่อ (Why Now)
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-reading-thai, inherit)",
                    fontSize: "13px",
                    color: "#94a3b8",
                    lineHeight: 1.5,
                  }}
                >
                  บอกช่วงเวลาและเหตุผลที่เหมาะสมในการเข้าพบลูกค้า
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#4ade80",
                    marginBottom: "3px",
                  }}
                >
                  ช่องว่างความคุ้มครอง (Coverage Gap)
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-reading-thai, inherit)",
                    fontSize: "13px",
                    color: "#94a3b8",
                    lineHeight: 1.5,
                  }}
                >
                  ค้นหาความคุ้มครองที่ยังขาด เพื่อวางแผนดูแลได้ตรงจุด
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#e2e8f0",
                    marginBottom: "3px",
                  }}
                >
                  แผนประกันที่แนะนำ (Recommendation)
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-reading-thai, inherit)",
                    fontSize: "13px",
                    color: "#94a3b8",
                    lineHeight: 1.5,
                  }}
                >
                  แนะนำผลิตภัณฑ์ที่ตรงเงื่อนไขและเป็นไปตามเกณฑ์ คปภ. ครบถ้วน
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Institutional Disclaimer */}
        <div
          className="login-brand-footer"
          style={{
            position: "relative",
            zIndex: 2,
            paddingTop: "20px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            fontSize: "12px",
            color: "#64748b",
          }}
        >
          <div>
            ธนาคารกรุงศรีอยุธยา จำกัด (มหาชน) • กลุ่มการเงินมิตซูบิชิ ยูเอฟเจ (MUFG)
          </div>
          <div>สอดคล้องกับกรอบธรรมาภิบาล AI ของ ธปท. และ คปภ.</div>
        </div>
      </section>

      {/* =========================================================================
          RIGHT SIDE: MINIMAL EXECUTIVE LOGIN EXPERIENCE (45% on Desktop)
          Clean, Spacious, Dignified, Bank-Grade Simplicity
          ========================================================================= */}
      <section
        aria-label="เข้าสู่ระบบ Broker Insight AI"
        className="login-form-panel"
        style={{
          flex: "1 1 45%",
          width: "100%",
          backgroundColor: "#fcfcfd",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "clamp(32px, 6vw, 80px) clamp(18px, 5vw, 64px)",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "400px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Subtle Environment Metadata Label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "#64748b",
                fontWeight: 500,
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#0284c7",
                }}
              />
              <span>Sandbox / Demo Environment</span>
            </div>

            <span
              style={{
                fontSize: "12px",
                color: "#94a3b8",
                fontWeight: 500,
              }}
            >
              Krungsri Hackathon Edition
            </span>
          </div>

          {/* Form Header */}
          <div style={{ marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                color: "#0f172a",
                margin: "0 0 8px 0",
                letterSpacing: "-0.02em",
              }}
            >
              เข้าสู่ระบบงาน
            </h2>
            <p
              style={{
                fontFamily: "var(--font-reading-thai, inherit)",
                fontSize: "14px",
                color: "#64748b",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              ลงชื่อเข้าใช้ Broker Insight AI เพื่อเริ่มต้นการปฏิบัติงาน
            </p>
          </div>

          {/* Error Message Banner */}
          {error && (
            <div
              role="alert"
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                fontSize: "13px",
                lineHeight: 1.5,
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span style={{ fontSize: "16px", flexShrink: 0 }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Standard Authentication Form */}
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {/* Email Input */}
            <div>
              <label
                htmlFor="login-email"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: "8px",
                }}
              >
                อีเมล
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="broker@demo.local"
                disabled={loading}
                style={{
                  width: "100%",
                  height: "46px",
                  padding: "0 16px",
                  fontSize: "14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#081628";
                  e.target.style.boxShadow = "0 0 0 3px rgba(8, 22, 40, 0.08)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#cbd5e1";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Password Input */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <label
                  htmlFor="login-password"
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#334155",
                  }}
                >
                  รหัสผ่าน
                </label>
                <button
                  type="button"
                  onClick={() => setPassword("demo1234")}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    fontSize: "12px",
                    color: "#0284c7",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  ใช้รหัสผ่านทดสอบ
                </button>
              </div>

              <div style={{ position: "relative" }}>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  disabled={loading}
                  style={{
                    width: "100%",
                    height: "46px",
                    padding: "0 46px 0 16px",
                    fontSize: "14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    color: "#0f172a",
                    outline: "none",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#081628";
                    e.target.style.boxShadow = "0 0 0 3px rgba(8, 22, 40, 0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#cbd5e1";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "16px",
                    color: "#64748b",
                    padding: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Remember Me Toggle */}
            <div style={{ display: "flex", alignItems: "center" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: "#475569",
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "4px",
                    accentColor: "#081628",
                    cursor: "pointer",
                  }}
                />
                <span>จดจำการเข้าสู่ระบบ</span>
              </label>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                height: "48px",
                borderRadius: "8px",
                backgroundColor: "#081628",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
                border: "1px solid #081628",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                transition: "background-color 0.2s, opacity 0.2s",
                boxShadow: "0 2px 6px rgba(8, 22, 40, 0.12)",
                marginTop: "6px",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "#0f2744";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "#081628";
                }
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      border: "2px solid #ffffff",
                      borderTopColor: "transparent",
                      display: "inline-block",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <span>กำลังเข้าสู่ระบบ...</span>
                </>
              ) : (
                <span>เข้าสู่ระบบ</span>
              )}
            </button>
          </form>

          {/* Quick Demo Roles for Reviewers & Judges */}
          <div
            style={{
              marginTop: "28px",
              paddingTop: "20px",
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#64748b",
                marginBottom: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>บัญชีทดสอบบทบาท (Demo Roles):</span>
              <span style={{ color: "#94a3b8" }}>รหัสผ่าน: demo1234</span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "8px",
              }}
            >
              <button
                type="button"
                onClick={() => selectDemoAccount("broker@demo.local")}
                style={{
                  padding: "8px 6px",
                  borderRadius: "6px",
                  border:
                    email === "broker@demo.local"
                      ? "1px solid #FECB00"
                      : "1px solid #e2e8f0",
                  backgroundColor:
                    email === "broker@demo.local" ? "#fffdf2" : "#ffffff",
                  color: "#0f172a",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s ease",
                }}
              >
                <div>👔 นายหน้า</div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 400 }}>
                  Broker
                </div>
              </button>

              <button
                type="button"
                onClick={() => selectDemoAccount("manager@demo.local")}
                style={{
                  padding: "8px 6px",
                  borderRadius: "6px",
                  border:
                    email === "manager@demo.local"
                      ? "1px solid #FECB00"
                      : "1px solid #e2e8f0",
                  backgroundColor:
                    email === "manager@demo.local" ? "#fffdf2" : "#ffffff",
                  color: "#0f172a",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s ease",
                }}
              >
                <div>📊 ผู้จัดการ</div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 400 }}>
                  Manager
                </div>
              </button>

              <button
                type="button"
                onClick={() => selectDemoAccount("admin@demo.local")}
                style={{
                  padding: "8px 6px",
                  borderRadius: "6px",
                  border:
                    email === "admin@demo.local"
                      ? "1px solid #FECB00"
                      : "1px solid #e2e8f0",
                  backgroundColor:
                    email === "admin@demo.local" ? "#fffdf2" : "#ffffff",
                  color: "#0f172a",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s ease",
                }}
              >
                <div>🛡️ แอดมิน</div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 400 }}>
                  Admin
                </div>
              </button>
            </div>
          </div>

          {/* Security Signal Note */}
          <div
            style={{
              marginTop: "24px",
              textAlign: "center",
              fontSize: "12px",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <span>🔒</span>
            <span>การเชื่อมต่อได้รับการปกป้องตามมาตรฐานของระบบ</span>
          </div>

          {/* Discreet Footer */}
          <div
            style={{
              marginTop: "16px",
              textAlign: "center",
              fontSize: "12px",
              color: "#94a3b8",
            }}
          >
            © Broker Insight AI • Krungsri Hackathon Edition
          </div>
        </div>
      </section>

      {/* Global CSS for Button Spinner & Mobile Layout Adaptation */}
      <style jsx global>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @media (min-width: 1024px) {
          .login-brand-panel {
            min-height: 100vh;
          }
          .login-form-panel {
            min-height: 100vh;
          }
        }
        @media (max-width: 1023px) {
          .login-brand-panel {
            min-height: auto !important;
            padding: 28px 20px 24px !important;
          }
          .login-info-card {
            display: none !important;
          }
          .login-brand-footer {
            display: none !important;
          }
          .login-form-panel {
            min-height: auto !important;
            padding: 28px 18px 48px !important;
          }
        }
      `}</style>
    </div>
  );
}
