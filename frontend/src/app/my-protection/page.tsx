"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { User } from "@/types";
import { AppShell } from "@/components/layout";
import { Card, Badge, Button, Status } from "@/components/ui";
import {
  TrustedAdvisorBadge,
  TrustedAdvisorCard,
  SmartphoneMockup,
  type AdvisorOutcome,
} from "@/components/domain";

interface LifeEventOption {
  id: string;
  icon: string;
  label: string;
  description: string;
  impactCategory: "motor" | "health" | "life_debt" | "tax";
  impactOutcome: AdvisorOutcome;
  impactNotice: string;
}

const LIFE_EVENTS: LifeEventOption[] = [
  {
    id: "motor_renewal",
    icon: "🚗",
    label: "ประกันรถยนต์ใกล้ครบกำหนด (ใน 30 วัน)",
    description: "รถยนต์ Honda City e:HEV ครบกำหนดต่ออายุ 21 วัน",
    impactCategory: "motor",
    impactOutcome: "action",
    impactNotice: "🔵 ต้องดำเนินการ: รักษาส่วนลดประวัติดี 20-30% และคุ้มครองต่อเนื่อง",
  },
  {
    id: "job_change",
    icon: "💼",
    label: "เพิ่งเปลี่ยนงานใหม่ / สิทธิประกันกลุ่มเปลี่ยน",
    description: "ย้ายบริษัท สิทธิค่าห้อง IPD/OPD ไม่เท่าที่เดิม หรือยังไม่พ้นโปร",
    impactCategory: "health",
    impactOutcome: "review",
    impactNotice: "🟡 ควรทบทวน: เช็กสิทธิกลุ่มใหม่ว่ามี Gap ค่าห้องส่วนเกินหรือไม่",
  },
  {
    id: "condo_loan",
    icon: "🏡",
    label: "เริ่มวางแผนกู้ซื้อคอนโด / เริ่มมีภาระผูกพัน",
    description: "กำลังมองหาคอนโดใกล้รถไฟฟ้า เริ่มมีความกังวลภาระหนี้สินผูกพัน",
    impactCategory: "life_debt",
    impactOutcome: "review",
    impactNotice: "🟡 ควรทบทวน: หากเริ่มกู้เงิน ควรพิจารณาประกันคุ้มครองวงเงิน (MRTA)",
  },
  {
    id: "health_concern",
    icon: "🩺",
    label: "ตรวจสุขภาพพบความเสี่ยง / กังวลโรคร้ายแรง",
    description: "คนรอบข้างหรือประวัติครอบครัวมีโรคร้ายแรง ต้องการเสริมความมั่นใจ",
    impactCategory: "health",
    impactOutcome: "action",
    impactNotice: "🔵 ต้องดำเนินการ: เติม CI Shield คุ้มครอง 50 โรคร้ายแรง ตรวจพบรับเงินก้อนทันที",
  },
  {
    id: "tax_planning",
    icon: "💰",
    label: "ต้องการวางแผนลดหย่อนภาษีปลายปี",
    description: "ฐานภาษีเริ่มสูงขึ้น (10-15%) ต้องการออมเงินที่หักภาษีได้",
    impactCategory: "tax",
    impactOutcome: "review",
    impactNotice: "🟡 ควรทบทวน: ประกันสะสมทรัพย์ 10/5 หรือบำนาญ Smart Pension หักลดหย่อนได้สูงสุด 1-2 แสน",
  },
];

export default function MyProtectionPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["motor_renewal"]);
  const [consultModalOpen, setConsultModalOpen] = useState(false);
  const [consultationSubmitted, setConsultationSubmitted] = useState(false);
  const [consultNote, setConsultNote] = useState("");

  useEffect(() => {
    async function initUser() {
      try {
        const u = await api.auth.me();
        setUser(u);
      } catch {
        setUser({
          id: "u-broker-1",
          email: "broker1@krungsri.demo",
          full_name: "สมชาย นายหน้า",
          role: "broker",
          is_active: true,
        });
      }
    }
    initUser();
  }, []);

  const toggleEvent = (id: string) => {
    setSelectedEvents((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  // Dynamic status evaluation
  const hasMotorUrgent = selectedEvents.includes("motor_renewal");
  const hasHealthUrgent = selectedEvents.includes("health_concern");
  const hasCondoPlan = selectedEvents.includes("condo_loan");

  const protectionContent = (
    <div>
      {/* Customer Profile Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #0b1e36 0%, #1e3a8a 100%)",
          color: "#ffffff",
          borderRadius: "16px",
          padding: viewMode === "mobile" ? "18px 14px" : "24px",
          marginBottom: "20px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(11, 30, 54, 0.15)",
        }}
      >
            {/* Background Glow */}
            <div
              style={{
                position: "absolute",
                top: "-40px",
                right: "-40px",
                width: "160px",
                height: "160px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(254, 203, 0, 0.35) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    backgroundColor: "var(--krungsri-yellow)",
                    color: "#0b1e36",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    fontWeight: 900,
                    boxShadow: "0 0 16px rgba(254, 203, 0, 0.5)",
                    flexShrink: 0,
                  }}
                >
                  พ
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800 }}>
                      คุณเพิร์ล (ณัฐชา ประเสริฐกิจการ)
                    </h2>
                    <span
                      style={{
                        fontSize: "11px",
                        backgroundColor: "rgba(255, 255, 255, 0.15)",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        fontWeight: 600,
                      }}
                    >
                      Gen Z · อายุ 26 ปี
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "rgba(255, 255, 255, 0.8)" }}>
                    Senior UX/UI Designer · บริษัท Tech Startup · ไม่มีภาระหนี้สิน
                  </p>
                </div>
              </div>

              {/* Quick Status Pill */}
              <div
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(8px)",
                  borderRadius: "12px",
                  padding: "8px 14px",
                  fontSize: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                }}
              >
                <div style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "10px", fontWeight: 700 }}>
                  KRUNGSRI TRUSTED ADVISOR
                </div>
                <div style={{ fontWeight: 800, marginTop: "2px", color: "var(--krungsri-yellow)" }}>
                  ให้คำแนะนำตามจริง · ไม่ Hard-sell
                </div>
              </div>
            </div>

            {/* 3 Clear Outcomes High-Level Summary Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: viewMode === "mobile" ? "1fr" : "repeat(3, 1fr)",
                gap: "12px",
                marginTop: "20px",
                paddingTop: "16px",
                borderTop: "1px solid rgba(255, 255, 255, 0.12)",
              }}
            >
              {/* Outcome 1: Action */}
              <div
                style={{
                  backgroundColor: "rgba(37, 99, 235, 0.2)",
                  border: "1px solid rgba(96, 165, 250, 0.4)",
                  borderRadius: "12px",
                  padding: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#93c5fd" }}>
                    🔵 ต้องดำเนินการ (Action)
                  </span>
                  <span style={{ fontSize: "10px", backgroundColor: "#1d4ed8", padding: "1px 6px", borderRadius: "999px" }}>
                    1 เรื่อง
                  </span>
                </div>
                <div style={{ fontSize: "14px", fontWeight: 800, marginTop: "6px" }}>
                  ต่อประกันรถยนต์ชั้น 1
                </div>
                <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.7)", marginTop: "2px" }}>
                  Honda City ครบกำหนดใน 21 วัน
                </div>
              </div>

              {/* Outcome 2: Review */}
              <div
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.2)",
                  border: "1px solid rgba(251, 191, 36, 0.4)",
                  borderRadius: "12px",
                  padding: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#fcd34d" }}>
                    🟡 ควรทบทวน (Review)
                  </span>
                  <span style={{ fontSize: "10px", backgroundColor: "#b45309", padding: "1px 6px", borderRadius: "999px" }}>
                    1 เรื่อง
                  </span>
                </div>
                <div style={{ fontSize: "14px", fontWeight: 800, marginTop: "6px" }}>
                  ช่องว่างสิทธิประกันกลุ่ม
                </div>
                <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.7)", marginTop: "2px" }}>
                  ค่าห้อง IPD 50k เสี่ยงไม่พอค่ารักษา รพ.เอกชน
                </div>
              </div>

              {/* Outcome 3: No Action */}
              <div
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.2)",
                  border: "1px solid rgba(52, 211, 153, 0.4)",
                  borderRadius: "12px",
                  padding: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#6ee7b7" }}>
                    🟢 ยังไม่ต้องทำอะไร (No Action)
                  </span>
                  <span style={{ fontSize: "10px", backgroundColor: "#065f46", padding: "1px 6px", borderRadius: "999px" }}>
                    1 เรื่อง
                  </span>
                </div>
                <div style={{ fontSize: "14px", fontWeight: 800, marginTop: "6px" }}>
                  ประกันชีวิต & คุ้มครองหนี้
                </div>
                <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.7)", marginTop: "2px" }}>
                  ไม่มีภาระหนี้ผูกพัน ไม่ต้องซื้อประกันชีวิตเพิ่ม
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Life Event Check-in (เกิดอะไรขึ้นกับชีวิตคุณ?) */}
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "24px",
              boxShadow: "0 2px 8px rgba(11, 30, 54, 0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0b1e36", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>🎯</span> เกิดอะไรขึ้นกับชีวิตคุณช่วงนี้? (Life Event Check-in)
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--slate-500)" }}>
                  เลือกสถานการณ์ปัจจุบันของคุณ เพื่อให้ AI และที่ปรึกษาปรับคำแนะนำให้ตรงกับชีวิตจริง
                </p>
              </div>
              <Badge variant="neutral" size="sm">
                เลือกแล้ว {selectedEvents.length} เหตุการณ์
              </Badge>
            </div>

            {/* Event Selection Chips */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: viewMode === "mobile" ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "10px",
              }}
            >
              {LIFE_EVENTS.map((event) => {
                const isSelected = selectedEvents.includes(event.id);
                return (
                  <div
                    key={event.id}
                    onClick={() => toggleEvent(event.id)}
                    style={{
                      border: isSelected ? "2px solid #2563eb" : "1px solid var(--border-subtle)",
                      backgroundColor: isSelected ? "rgba(37, 99, 235, 0.04)" : "#ffffff",
                      borderRadius: "12px",
                      padding: "12px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      display: "flex",
                      gap: "10px",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ fontSize: "20px", flexShrink: 0 }}>{event.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: isSelected ? "#1e40af" : "#0b1e36" }}>
                          {event.label}
                        </span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          style={{ cursor: "pointer", accentColor: "#2563eb" }}
                        />
                      </div>
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--slate-500)" }}>
                        {event.description}
                      </p>
                      {isSelected && (
                        <div
                          style={{
                            marginTop: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            color:
                              event.impactOutcome === "action"
                                ? "#1e40af"
                                : event.impactOutcome === "review"
                                ? "#92400e"
                                : "#065f46",
                          }}
                        >
                          {event.impactNotice}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Anchor Use Cases: Health + Motor + Life & Debt */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "24px" }}>
            {/* Section Header */}
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0b1e36", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🛡️</span> สถานะความคุ้มครองรายหมวด (Your Protection Status)
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--slate-600)" }}>
                วิเคราะห์เชิงลึกด้วยเกณฑ์ Trusted Advisor: ชี้เป้าความเสี่ยงจริง ไม่ชวนซื้อของที่ยังไม่ต้องใช้
              </p>
            </div>

            {/* 1. MOTOR CARD (Action) */}
            <TrustedAdvisorCard
              category="motor"
              title="ประกันภัยรถยนต์ — Honda City e:HEV"
              subtitle="กรมธรรม์ชั้น 1 ซ่อมห้าง · ทุนประกัน 650,000 บาท"
              currentStatus="มีประกันภัยชั้น 1 อยู่ แต่จะครบกำหนดในอีก 21 วัน (เหลือเวลาสั้นที่สุดในพอร์ต)"
              outcome={hasMotorUrgent ? "action" : "review"}
              whyNowTrigger="ต่อประกันรถใน 21 วัน เพื่อรักษาสิทธิส่วนลดประวัติดี 20-30% และบริการช่วยเหลือฉุกเฉิน 24 ชม."
              advisorReason="รถยนต์เป็นทรัพย์สินที่เพิร์ลใช้งานทุกวัน การปล่อยให้ประกันขาดช่วงแม้แต่วันเดียวอาจทำให้เสียสิทธิส่วนลดประวัติดี และเสี่ยงต่อภาระค่าใช้จ่ายหากเกิดอุบัติเหตุบนท้องถนน จึงเป็นเรื่องที่ 'ต้องทำทันที'"
              recommendedNextStep="กดรับใบเสนอราคาต่ออายุเพื่อเปรียบเทียบเบี้ยกับส่วนลดประวัติดีเดิม"
              primaryActionLabel="⚡ รับใบเสนอราคาต่ออายุชั้น 1 (เบี้ยเดิม + ซ่อมศูนย์)"
              onActionClick={() => {
                setConsultNote("สนใจต่ออายุประกันภัยรถยนต์ Honda City e:HEV (เหลือ 21 วัน) ขอใบเสนอราคาชั้น 1 ซ่อมศูนย์");
                setConsultModalOpen(true);
              }}
            />

            {/* 2. HEALTH CARD (Review) */}
            <TrustedAdvisorCard
              category="health"
              title="ประกันสุขภาพ & ค่ารักษาพยาบาล (Health Protection)"
              subtitle="ปัจจุบันมีสิทธิประกันสุขภาพกลุ่มจากบริษัท (Corporate Group Health)"
              currentStatus="มีประกันกลุ่มบริษัท: วงเงิน IPD 50,000 บาท/ครั้ง, ค่าห้อง 2,500 บาท/วัน, ไม่มีคุ้มครองโรคร้ายแรง (CI)"
              outcome={hasHealthUrgent ? "action" : "review"}
              gapAnalysis={{
                current: "ค่าห้อง 2,500 บ./วัน · วงเงิน 50,000 บ./ครั้ง",
                benchmark: "ค่าห้องเอกชน 6,000-8,000 บ. · ค่ารักษาเฉลี่ย 150k-300k",
                gapDescription:
                  "หากแอดมิตโรงพยาบาลเอกชนชั้นนำ เพิร์ลอาจต้องควักเงินเก็บจ่ายส่วนเกินค่าห้องประมาณ 3,500-5,500 บ./วัน และส่วนเกินค่าผ่าตัด",
              }}
              whyNowTrigger="มีประกันกลุ่มจากบริษัทแต่ไม่มี health coverage ส่วนตัว หากออกจากงานหรือเจ็บป่วยรุนแรงอาจกระทบเงินออม"
              advisorReason="เพิร์ลไม่ต้องยกเลิกหรือทิ้งประกันกลุ่ม! ทางเลือกที่ฉลาดที่สุดคือ 'Top-up เฉพาะส่วนเกิน' เช่น ซื้อแผนเหมาจ่ายแบบมีความรับผิดชอบส่วนแรก (Deductible) หรือเสริมเฉพาะโรคร้ายแรง (CI Shield) ซึ่งจะจ่ายเบี้ยถูกลงกว่าประกันสุขภาพทั่วไปถึง 40-50%"
              recommendedNextStep="ดูการจำลองแผน Top-up ส่วนเกินจากประกันกลุ่มเพื่อไม่ให้ซ้ำซ้อนและประหยัดเบี้ย"
              primaryActionLabel="🔍 คำนวณเบี้ย Top-up ค่าห้อง & โรคร้ายแรง"
              onActionClick={() => {
                setConsultNote("สนใจปรึกษาเรื่องช่องว่างประกันกลุ่มบริษัท อยากได้แผน Top-up ค่าห้อง รพ.เอกชน และโรคร้ายแรง");
                setConsultModalOpen(true);
              }}
            />

            {/* 3. LIFE & DEBT CARD (No Action) */}
            <TrustedAdvisorCard
              category="life_debt"
              title="ประกันชีวิต & คุ้มครองภาระหนี้ (Life & Debt Protection)"
              subtitle="ความคุ้มครองกรณีเสียชีวิต และภาระหนี้สินผูกพันระยะยาว"
              currentStatus="ไม่มีภาระหนี้บ้านหรือสินเชื่อผูกพัน (Debt-free) · ไม่มีผู้อยู่ในอุปการะทางการเงิน"
              outcome={hasCondoPlan ? "review" : "no_action"}
              advisorReason={
                hasCondoPlan
                  ? "เนื่องจากเพิร์ลกำลังมีแผนกู้ซื้อคอนโด หากเริ่มทำสัญญาเงินกู้ ควรทบทวนประกันคุ้มครองวงเงินสินเชื่อบ้าน (MRTA) เพื่อไม่ให้ภาระหนี้ตกแก่ครอบครัว"
                  : "คุณเพิร์ลยังอยู่ในวัยสร้างตัว ไม่มีหนี้สินก้อนใหญ่ และยังไม่มีภาระต้องส่งเสียครอบครัว ที่ปรึกษาขอแนะนำอย่างตรงไปตรงมาว่า 'ยังไม่ต้องซื้อประกันชีวิตทุนสูงในเวลานี้' นำเงินก้อนนี้ไปออมหรือลงทุนในกองทุนดัชนี (Dime! / Krungsri Tech) จะตอบโจทย์ชีวิต Gen Z มากกว่า"
              }
              recommendedNextStep={
                hasCondoPlan
                  ? "เตรียมปรึกษาคำนวณวงเงิน MRTA ควบคู่กับสัญญาเงินกู้คอนโด"
                  : "คงสถานะเดิมไว้ ทบทวนอีกครั้งเมื่อเริ่มมีแผนกู้ซื้อที่อยู่อาศัยหรือมีครอบครัว"
              }
              primaryActionLabel={hasCondoPlan ? "📋 วางแผนคุ้มครองหนี้คอนโด" : undefined}
              onActionClick={
                hasCondoPlan
                  ? () => {
                      setConsultNote("กำลังวางแผนกู้ซื้อคอนโด ต้องการขอคำแนะนำเรื่องประกันคุ้มครองวงเงิน MRTA");
                      setConsultModalOpen(true);
                    }
                  : undefined
              }
            />
          </div>

          {/* Direct Trusted Connection with Broker */}
          <div
            style={{
              backgroundColor: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
              border: "2px dashed #cbd5e1",
              borderRadius: "16px",
              padding: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "var(--krungsri-navy)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  flexShrink: 0,
                }}
              >
                💼
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0b1e36" }}>
                    โบรกเกอร์ผู้ดูแล: คุณสมชาย นายหน้า
                  </h4>
                  <Badge variant="success" size="sm">
                    พร้อมให้คำปรึกษา
                  </Badge>
                </div>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--slate-600)" }}>
                  Krungsri Certified Broker · ให้คำปรึกษาด้วยจุดยืน Trusted Advisor โปร่งใส ตรงประเด็น
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Button
                variant="primary"
                size="md"
                leftIcon="💬"
                onClick={() => {
                  setConsultNote("สวัสดีครับคุณสมชาย สนใจปรึกษาเรื่องต่อประกันรถยนต์ Honda City ใน 21 วัน และวางแผน Top-up ประกันกลุ่มครับ");
                  setConsultModalOpen(true);
                }}
              >
                ส่งข้อความปรึกษาโบรกเกอร์
              </Button>
              <Link href="/customers/c0c0f992-b06d-4b9f-bbc6-9b4458a79491">
                <Button variant="outline" size="md" leftIcon="🔍">
                  ดูมุมมอง Broker Insight AI
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );

  return (
    <AppShell
      user={user}
      title="My Protection — ประกันสำหรับตัวคุณ (Customer View)"
      subtitle="มุมมองลูกค้า Gen Z: ตรวจสอบความคุ้มครอง รู้ชัดเจนว่าอะไรต้องทำ อะไรยังไม่ต้องทำ"
      actions={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* View Mode Toggle */}
          <div
            style={{
              display: "inline-flex",
              backgroundColor: "rgba(11, 30, 54, 0.06)",
              borderRadius: "8px",
              padding: "2px",
            }}
          >
            <button
              onClick={() => setViewMode("desktop")}
              style={{
                border: "none",
                borderRadius: "6px",
                padding: "5px 12px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                backgroundColor: viewMode === "desktop" ? "#ffffff" : "transparent",
                color: viewMode === "desktop" ? "#0b1e36" : "var(--slate-600)",
                boxShadow: viewMode === "desktop" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              💻 ขยายเต็มจอ
            </button>
            <button
              onClick={() => setViewMode("mobile")}
              style={{
                border: "none",
                borderRadius: "6px",
                padding: "5px 12px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                backgroundColor: viewMode === "mobile" ? "#ffffff" : "transparent",
                color: viewMode === "mobile" ? "#0b1e36" : "var(--slate-600)",
                boxShadow: viewMode === "mobile" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              📱 iPhone 17 Pro Max (Preview)
            </button>
          </div>

          <Link href="/customers/c0c0f992-b06d-4b9f-bbc6-9b4458a79491">
            <Button variant="outline" size="sm" leftIcon="💼">
              ดูมุมมองโบรกเกอร์ (Broker View)
            </Button>
          </Link>
        </div>
      }
    >
      {viewMode === "mobile" ? (
        <SmartphoneMockup
          onOpenConsult={() => {
            setConsultNote("สวัสดีครับคุณสมชาย สนใจปรึกษาเรื่องต่อประกันรถยนต์ Honda City ใน 21 วัน และวางแผน Top-up ประกันกลุ่มครับ");
            setConsultModalOpen(true);
          }}
        >
          {protectionContent}
        </SmartphoneMockup>
      ) : (
        <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "40px" }}>
          {protectionContent}
        </div>
      )}

      {/* Consultation Modal Simulator */}
      {consultModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(11, 30, 54, 0.6)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              padding: "28px",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
            }}
          >
            {consultationSubmitted ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
                <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 800, color: "#0b1e36" }}>
                  ส่งคำขอปรึกษาเรียบร้อยแล้ว!
                </h3>
                <p style={{ fontSize: "14px", color: "var(--slate-600)", lineHeight: 1.5, margin: "0 0 20px" }}>
                  คุณสมชาย นายหน้า ได้รับเรื่องเรียบร้อยแล้ว โดยระบบได้สรุป Why now trigger:{" "}
                  <strong>"ต่อประกันรถใน 21 วัน และ Gap ประกันกลุ่ม"</strong> เข้าสู่ระบบ Broker Workspace ทันที
                </p>
                <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setConsultModalOpen(false);
                      setConsultationSubmitted(false);
                    }}
                  >
                    เข้าใจแล้ว
                  </Button>
                  <Link href="/customers/c0c0f992-b06d-4b9f-bbc6-9b4458a79491">
                    <Button variant="gold" size="md">
                      ดูคิวนายหน้าใน Dashboard →
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0b1e36", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>💬</span> ปรึกษาโบรกเกอร์ (Trusted Advisor)
                  </h3>
                  <button
                    onClick={() => setConsultModalOpen(false)}
                    style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "var(--slate-400)" }}
                  >
                    ✕
                  </button>
                </div>

                <p style={{ fontSize: "13px", color: "var(--slate-600)", margin: "0 0 16px" }}>
                  ส่งข้อความถึงคุณสมชาย นายหน้าผู้ดูแลคุณ โดยข้อมูลความคุ้มครองและสิ่งที่ต้องการปรึกษาจะเชื่อมโยงกับระบบ AI Insight โดยอัตโนมัติ
                </p>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#0b1e36", marginBottom: "6px" }}>
                    ข้อความที่คุณต้องการปรึกษา:
                  </label>
                  <textarea
                    value={consultNote}
                    onChange={(e) => setConsultNote(e.target.value)}
                    rows={4}
                    style={{
                      width: "100%",
                      borderRadius: "10px",
                      border: "1px solid var(--border-subtle)",
                      padding: "10px 12px",
                      fontSize: "13px",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <div
                  style={{
                    backgroundColor: "#f1f5f9",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    fontSize: "11px",
                    color: "var(--slate-600)",
                    marginBottom: "20px",
                  }}
                >
                  🔒 <strong>Krungsri Privacy Guarantee:</strong> การสนทนานี้เป็นไปตามมาตรฐานการกำกับดูแล
                  จะไม่มีการนำเบอร์โทรของคุณไปขายต่อ หรือมีการโทรตื๊อขายประกันใดๆ ทั้งสิ้น
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <Button variant="outline" size="md" onClick={() => setConsultModalOpen(false)}>
                    ยกเลิก
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setConsultationSubmitted(true);
                    }}
                  >
                    ยืนยันส่งเรื่องปรึกษา
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
