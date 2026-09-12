"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface DemoPersona {
  id: string;
  externalRef: string;
  name: string;
  tier: string;
  badge: string;
  badgeColor: string;
  highlight: string;
  icon: string;
}

const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: "d82e838c-63fb-47a3-9428-f15dc4d68883",
    externalRef: "KS-00001",
    name: "ณัฐพร วาริน",
    tier: "Platinum",
    badge: "ต่ออายุด่วน (14 วัน)",
    badgeColor: "#dc2626",
    highlight: "Priority 92/100 · กรมธรรม์ใกล้ครบกำหนด · โอกาสต่ออายุและอัปเกรดสุขภาพ",
    icon: "⚡",
  },
  {
    id: "c0c0f992-b06d-4b9f-bbc6-9b4458a79491",
    externalRef: "KS-00002",
    name: "ณัฐชา 'เพิร์ล' ประเสริฐกิจการ",
    tier: "Standard",
    badge: "Gen Z Health + Motor",
    badgeColor: "#0284c7",
    highlight: "อายุ 26 ปี · ต่อประกันรถ 21 วัน · สิทธิกลุ่มไม่พอค่าห้อง รพ.เอกชน · Trusted Advisor ไม่ขายประกันชีวิต",
    icon: "🚗",
  },
  {
    id: "c0a451ce-a2b5-406e-9358-4a2af87721ca",
    externalRef: "KS-00004",
    name: "วิภา ชัยโย",
    tier: "Gold",
    badge: "Protection Gap หนี้บ้าน",
    badgeColor: "#d97706",
    highlight: "สินเชื่อบ้าน 5.5 ล้านบาท ไร้ประกันคุ้มครองวงเงิน · แนะนำ Krungsri MRTA",
    icon: "🛡️",
  },
  {
    id: "f535562e-8f70-4711-bbd0-7e092606cdd7",
    externalRef: "KS-00005",
    name: "ธนภูมิ ยิ้มแย้ม",
    tier: "Platinum",
    badge: "วางแผนบำนาญ AUM สูง",
    badgeColor: "#5a4544",
    highlight: "อายุ 52 ปี 3 กรมธรรม์เดิมครบถ้วน · แนะนำประกันบำนาญ Krungsri Smart Pension",
    icon: "💰",
  },
  {
    id: "0dd17657-a534-4f57-836c-26d73cc0c2e5",
    externalRef: "KS-00006",
    name: "วิภา รุ่งเรือง",
    tier: "Standard",
    badge: "KYC Pending Opportunity",
    badgeColor: "#7c3aed",
    highlight: "รอยืนยันตัวตน · บัญชีเงินฝากพร้อม · นำเสนอประกันสะสมทรัพย์ Krungsri 10/5",
    icon: "⏳",
  },
];

export function DemoPersonaStrip() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="no-print"
      style={{
        marginBottom: "var(--space-5)",
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderLeft: "4px solid var(--krungsri-yellow)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
      }}
    >
      {/* Bar Header */}
      <div
        style={{
          padding: "12px 18px",
          background: "var(--krungsri-navy-gradient)",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "16px" }}>⚡</span>
          <span style={{ fontWeight: 800, fontSize: "14px", letterSpacing: "0.02em" }}>
            กรณีศึกษาและกลุ่มลูกค้าตัวอย่าง (Featured Customer Cases)
          </span>
          <span
            style={{
              fontSize: "12px",
              background: "var(--krungsri-gold-gradient)",
              color: "var(--krungsri-navy)",
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              boxShadow: "0 1px 4px rgba(254, 203, 0, 0.4)",
            }}
          >
            Quick Switch
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: "var(--slate-300)" }}>
          <span style={{ fontWeight: 600 }}>{collapsed ? "คลิกเพื่อเปิดดู 5 กรณีศึกษา ▼" : "คลิกเพื่อย่อ ▲"}</span>
        </div>
      </div>

      {/* Bar Content: 4 Demo Persona Cards */}
      {!collapsed && (
        <div
          style={{
            padding: "14px 18px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
            backgroundColor: "var(--slate-50)",
          }}
        >
          {DEMO_PERSONAS.map((p) => {
            const isActive = pathname?.includes(p.id) || pathname?.includes(p.externalRef);

            return (
              <Link
                key={p.externalRef}
                href={`/customers/${p.id}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div
                  className="hover-lift"
                  style={{
                    padding: "12px 14px",
                    backgroundColor: isActive ? "#ffffff" : "var(--bg-surface)",
                    border: `2px solid ${isActive ? "var(--krungsri-yellow)" : "var(--border-subtle)"}`,
                    borderRadius: "var(--radius-lg)",
                    cursor: "pointer",
                    transition: "all var(--motion-fast) ease",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: isActive
                      ? "0 0 0 3px rgba(254, 203, 0, 0.25), var(--shadow-sm)"
                      : "var(--shadow-xs)",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "15px" }}>{p.icon}</span>
                        <strong style={{ fontSize: "14px", color: "var(--slate-900)" }}>{p.name}</strong>
                      </div>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: p.badgeColor,
                          backgroundColor: `${p.badgeColor}18`,
                          padding: "2px 7px",
                          borderRadius: "var(--radius-full)",
                        }}
                      >
                        {p.badge}
                      </span>
                    </div>

                    <div style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "4px" }}>
                      รหัส: <strong>{p.externalRef}</strong> · {p.tier} Tier
                    </div>

                    <div style={{ fontSize: "12px", color: "var(--slate-600)", marginTop: "6px", lineHeight: 1.4 }}>
                      {p.highlight}
                    </div>

                    {p.externalRef === "KS-00002" && (
                      <div style={{ marginTop: "6px" }}>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            backgroundColor: "#FAF7F6",
                            color: "#5a4544",
                            border: "1px solid #E2DAD9",
                            borderRadius: "4px",
                            padding: "2px 6px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          <span>📱</span> เปิดหน้า My Protection ได้
                        </span>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: isActive ? "var(--krungsri-navy)" : "var(--slate-400)",
                      marginTop: "10px",
                      textAlign: "right",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: "4px",
                    }}
                  >
                    {isActive ? (
                      <span style={{ color: "#d97706", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        ● กำลังแสดงเคสนี้
                      </span>
                    ) : (
                      <span>คลิกเพื่อเปิด →</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
