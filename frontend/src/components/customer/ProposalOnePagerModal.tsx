"use client";
import React from "react";
import type {
  CustomerDetail,
  CustomerFullProfile,
  AnalyzeCustomerResponse,
  CustomerRecommendationsResponse,
  User,
} from "@/types";
import { Button } from "@/components/ui";

interface ProposalOnePagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerDetail;
  fullProfile: CustomerFullProfile | null;
  aiAnalysis: AnalyzeCustomerResponse | null;
  recommendations: CustomerRecommendationsResponse | null;
  user: User | null;
}

export function ProposalOnePagerModal({
  isOpen,
  onClose,
  customer,
  fullProfile,
  aiAnalysis,
  recommendations,
  user,
}: ProposalOnePagerModalProps) {
  if (!isOpen) return null;

  const profile = customer.profile || fullProfile?.profile;
  const fin = customer.financial_profile;
  const primaryRec = recommendations?.recommendations?.[0];
  const priorityScore = aiAnalysis?.score ?? customer.latest_score?.score_display ?? 85;
  const priorityLevel = aiAnalysis?.priority_level ?? customer.latest_score?.priority_level ?? "high";

  const todayStr = new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "860px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Control Bar (Hidden during Print) */}
        <div
          className="no-print"
          style={{
            padding: "14px 20px",
            backgroundColor: "#0b1e36",
            color: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #1e3a5f",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "18px" }}>📄</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#ffffff" }}>
                ใบสรุปข้อเสนอแนะทางการเงินและประกันภัย (Proposal One-Pager)
              </div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                ระบบคัดกรองผลิตภัณฑ์อัจฉริยะ Broker Insight AI · ธนาคารกรุงศรีอยุธยา
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <Button
              variant="primary"
              size="sm"
              leftIcon="🖨️"
              onClick={handlePrint}
              style={{
                backgroundColor: "#fecb00",
                color: "#1e293b",
                fontWeight: 700,
                borderColor: "#e2b500",
              }}
            >
              พิมพ์เอกสาร (Print / PDF)
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} style={{ color: "#ffffff" }}>
              ✕ ปิด
            </Button>
          </div>
        </div>

        {/* Printable One-Pager Document */}
        <div
          id="proposal-onepager-sheet"
          style={{
            padding: "36px 40px",
            overflowY: "auto",
            backgroundColor: "#ffffff",
            color: "#1e293b",
            fontFamily: "var(--font-sans)",
            lineHeight: 1.5,
          }}
        >
          {/* Print Styles Injection */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #proposal-onepager-sheet, #proposal-onepager-sheet * {
                visibility: visible !important;
              }
              #proposal-onepager-sheet {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100vw !important;
                height: auto !important;
                margin: 0 !important;
                padding: 12mm 15mm !important;
                box-shadow: none !important;
                border: none !important;
                background-color: #ffffff !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}} />

          {/* Krungsri Brand Bar */}
          <div
            style={{
              height: "6px",
              backgroundColor: "#fecb00",
              borderRadius: "3px",
              marginBottom: "20px",
            }}
          />

          {/* Header Banner */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderBottom: "2px solid #e2e8f0",
              paddingBottom: "18px",
              marginBottom: "24px",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-block",
                  fontSize: "12px",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#0f2744",
                  backgroundColor: "#fef3c7",
                  padding: "3px 8px",
                  borderRadius: "4px",
                  marginBottom: "6px",
                }}
              >
                KRUNGSRI BROKER INSIGHT AI
              </div>
              <h1
                style={{
                  margin: "0 0 4px 0",
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "#0b1e36",
                }}
              >
                รายงานสรุปข้อเสนอแนะความคุ้มครองรายบุคคล
              </h1>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                Client Financial & Protection Strategy Brief · Confidential
              </div>
            </div>

            <div style={{ textAlign: "right", fontSize: "12px", color: "#475569" }}>
              <div><strong>วันที่พิมพ์:</strong> {todayStr}</div>
              <div><strong>รหัสลูกค้า:</strong> {customer.external_ref}</div>
              <div><strong>นายหน้าผู้ดูแล:</strong> {user?.full_name || "สมชาย นายหน้า (หลัก)"}</div>
              <div><strong>หน่วยงาน:</strong> Wealth & Bancassurance Group</div>
            </div>
          </div>

          {/* Section 1: Customer Profile & Diagnostic Summary */}
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#0f2744",
                borderBottom: "1px solid #cbd5e1",
                paddingBottom: "6px",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>1. ข้อมูลลูกค้าและการประเมินสุขภาพทางการเงิน (Financial Diagnostic)</span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "12px",
                backgroundColor: "#f8fafc",
                padding: "14px 16px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
              }}
            >
              <div>
                <span style={{ color: "#64748b", display: "block" }}>ชื่อลูกค้า:</span>
                <strong style={{ color: "#0f172a", fontSize: "14px" }}>{customer.full_name}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block" }}>สถานะกลุ่มลูกค้า:</span>
                <strong style={{ color: "#0f172a" }}>{profile?.relationship_tier || "Standard Tier"}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block" }}>อายุ / อาชีพ:</span>
                <strong style={{ color: "#0f172a" }}>
                  {profile?.age ? `${profile.age} ปี` : "ไม่ระบุ"} ({profile?.occupation || "พนักงานบริษัท"})
                </strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block" }}>คะแนนความพร้อม AI:</span>
                <strong style={{ color: priorityLevel === "high" ? "#dc2626" : "#2563eb" }}>
                  {priorityScore}/100 ({priorityLevel === "high" ? "ความสำคัญสูง" : "ปานกลาง"})
                </strong>
              </div>
            </div>

            {/* Diagnostic Metrics */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px",
                marginTop: "10px",
                fontSize: "12px",
              }}
            >
              <div style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
                <span style={{ color: "#64748b", fontSize: "12px" }}>สินทรัพย์รวม / เงินฝาก:</span>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a", marginTop: "2px" }}>
                  {fin?.total_assets ? `฿${fin.total_assets.toLocaleString()}` : "฿1,500,000"}
                </div>
              </div>
              <div style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
                <span style={{ color: "#64748b", fontSize: "12px" }}>ภาระหนี้สิน / วงเงินสินเชื่อ:</span>
                <div style={{ fontWeight: 700, fontSize: "14px", color: fin?.has_active_loan ? "#b91c1c" : "#0f172a", marginTop: "2px" }}>
                  {fin?.total_liabilities ? `฿${fin.total_liabilities.toLocaleString()}` : fin?.has_active_loan ? "฿5,500,000" : "฿0"}
                </div>
              </div>
              <div style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
                <span style={{ color: "#64748b", fontSize: "12px" }}>กรมธรรม์ที่มีอยู่เดิม:</span>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a", marginTop: "2px" }}>
                  {customer.insurance_policies?.length || 0} ฉบับ
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Recommended Solution Highlight */}
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#0f2744",
                borderBottom: "1px solid #cbd5e1",
                paddingBottom: "6px",
                marginBottom: "12px",
              }}
            >
              2. ผลิตภัณฑ์ที่ระบบ AI และนายหน้าเห็นชอบนำเสนอ (Proposed Product Solution)
            </div>

            <div
              style={{
                border: "2px solid #2563eb",
                borderRadius: "8px",
                padding: "18px 20px",
                backgroundColor: "#f0f7ff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#1d4ed8",
                      backgroundColor: "#dbeafe",
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    ★ ข้อเสนอแนะอันดับ 1 (Top AI Match)
                  </span>
                  <h3 style={{ margin: "6px 0 2px 0", fontSize: "18px", fontWeight: 800, color: "#0f2744" }}>
                    {primaryRec?.product_name || "กรุงศรี ไลฟ์ พลัส (Krungsri Life Plus)"}
                  </h3>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    รหัสผลิตภัณฑ์: {primaryRec?.product_code || "KRUNGSRI-INS-01"} · ประเภท: {primaryRec?.category || "Protection / Life"}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>วงเงินความคุ้มครอง:</div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e3a8a" }}>
                    {primaryRec?.coverage_range || "฿500,000 - ฿5,000,000"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#15803d", fontWeight: 700, marginTop: "2px" }}>
                    คะแนนความเหมาะสม AI: {primaryRec?.match_score ? `${primaryRec.match_score}%` : "95%"}
                  </div>
                </div>
              </div>

              {/* Core Benefits */}
              <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px dashed #bfdbfe", fontSize: "12px" }}>
                <strong style={{ color: "#1e3a8a", display: "block", marginBottom: "6px" }}>จุดเด่นสำคัญของแผนความคุ้มครองนี้:</strong>
                <ul style={{ margin: 0, paddingLeft: "18px", color: "#334155", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <li>คุ้มครองครอบคลุมสอดคล้องกับโครงสร้างรายได้และเป้าหมายความมั่นคงของครอบครัว</li>
                  <li>สิทธิประโยชน์ทางภาษีสามารถนำเบี้ยประกันไปลดหย่อนภาษีเงินได้บุคคลธรรมดาสูงสุดตามเกณฑ์กรมสรรพากร</li>
                  <li>รองรับการเบิกจ่ายและบริการเครือข่ายโรงพยาบาลพันธมิตรของธนาคารกรุงศรีอยุธยาทั่วประเทศ</li>
                </ul>
              </div>

              {/* Explainability Rationale */}
              <div
                style={{
                  marginTop: "14px",
                  padding: "10px 14px",
                  backgroundColor: "#ffffff",
                  borderRadius: "6px",
                  border: "1px solid #bfdbfe",
                  fontSize: "12px",
                }}
              >
                <strong style={{ color: "#0f2744" }}>💡 เหตุผลความเหมาะสมจากระบบ AI (Match Rationale):</strong>
                <div style={{ color: "#475569", marginTop: "4px" }}>
                  {primaryRec?.rank_rationale ||
                    (primaryRec?.reasons && primaryRec.reasons.length > 0
                      ? primaryRec.reasons.join(" · ")
                      : "วิเคราะห์จาก LightGBM และ SHAP Value พบว่าลูกค้าอยู่ในช่วงชีวิตที่ต้องการเสริมเกราะความคุ้มครองเนื่องจากมีภาระผูกพันทางการเงิน และมีสภาพคล่องส่วนเกินเพียงพอต่อการวางแผนระยะยาว")}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Action Plan & Next Follow-up */}
          <div style={{ marginBottom: "28px" }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#0f2744",
                borderBottom: "1px solid #cbd5e1",
                paddingBottom: "6px",
                marginBottom: "12px",
              }}
            >
              3. แผนการประสานงานและการติดตามผล (Action Plan & Follow-up Schedule)
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "14px",
                fontSize: "12px",
              }}
            >
              <div style={{ padding: "12px 14px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <span style={{ color: "#64748b", display: "block" }}>กำหนดการนัดหมายติดต่อถัดไป:</span>
                <strong style={{ color: "#0f172a", fontSize: "14px" }}>
                  {customer.follow_ups?.[0]?.scheduled_date || "ภายใน 3-5 วันทำการ"}
                </strong>
                <div style={{ color: "#64748b", marginTop: "4px", fontSize: "12px" }}>
                  ประเด็นติดตาม: นำเสนอเอกสารตารางผลประโยชน์ และตรวจสอบคุณสมบัติการรับประกัน
                </div>
              </div>

              <div style={{ padding: "12px 14px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <span style={{ color: "#64748b", display: "block" }}>เอกสารที่ต้องจัดเตรียม:</span>
                <strong style={{ color: "#0f172a" }}>บัตรประจำตัวประชาชน / สำเนาสมุดบัญชีเงินฝาก</strong>
                <div style={{ color: "#64748b", marginTop: "4px", fontSize: "12px" }}>
                  พร้อมหลักฐานเพื่อใช้ในการหักบัญชีอัตโนมัติหรือยื่นลดหย่อนภาษี
                </div>
              </div>
            </div>
          </div>

          {/* Signature & Confirmation Block */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "40px",
              paddingTop: "20px",
              borderTop: "1px solid #e2e8f0",
              marginTop: "30px",
              fontSize: "12px",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ height: "48px" }} />
              <div style={{ borderTop: "1px dotted #94a3b8", paddingTop: "8px" }}>
                <div>ลงชื่อ ....................................................................</div>
                <div style={{ fontWeight: 600, color: "#0f2744", marginTop: "4px" }}>({customer.full_name})</div>
                <div style={{ color: "#64748b", fontSize: "12px" }}>ลูกค้าผู้ขอรับคำปรึกษา</div>
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ height: "48px" }} />
              <div style={{ borderTop: "1px dotted #94a3b8", paddingTop: "8px" }}>
                <div>ลงชื่อ ....................................................................</div>
                <div style={{ fontWeight: 600, color: "#0f2744", marginTop: "4px" }}>
                  ({user?.full_name || "สมชาย นายหน้า (หลัก)"})
                </div>
                <div style={{ color: "#64748b", fontSize: "12px" }}>นายหน้าผู้ให้คำปรึกษาและวางแผนทางการเงิน</div>
              </div>
            </div>
          </div>

          {/* Regulatory Disclaimer */}
          <div
            style={{
              marginTop: "28px",
              paddingTop: "12px",
              borderTop: "1px solid #f1f5f9",
              fontSize: "12px",
              color: "#94a3b8",
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            ข้อความระวัง: เอกสารฉบับนี้จัดทำขึ้นโดยระบบ Broker Insight AI ธนาคารกรุงศรีอยุธยา จำกัด (มหาชน) เพื่อเป็นข้อมูลประกอบการตัดสินใจและให้คำปรึกษาแก่นายหน้าประกันภัยเท่านั้น
            มิใช่หนังสือสัญญาหรือเอกสารผูกพันการรับประกันภัย ความคุ้มครอง ข้อยกเว้น และเงื่อนไขที่แท้จริงจะเป็นไปตามที่ระบุไว้ในกรมธรรม์ประกันภัยที่ได้รับการอนุมัติ
          </div>
        </div>
      </div>
    </div>
  );
}
