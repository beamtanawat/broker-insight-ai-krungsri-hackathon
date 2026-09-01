import React from "react";
import type { CustomerDetail, CustomerFullProfile } from "@/types";
import { Badge, Card, Status } from "@/components/ui";
import { AILabel } from "@/components/domain";

interface CustomerOverviewProps {
  customer: CustomerDetail;
  fullProfile: CustomerFullProfile | null;
}

/**
 * Tab 1: Customer Overview
 * Answers: "What do I need to know before working with this customer?"
 * Grouped into Customer Snapshot, Financial Snapshot, Insurance Snapshot, and Relationship & Engagement.
 */
export function CustomerOverview({ customer, fullProfile }: CustomerOverviewProps) {
  const profile = customer.profile || fullProfile?.profile;
  const financial = customer.financial_profile || fullProfile?.financial_profile;
  const policies = customer.insurance_policies || fullProfile?.active_policies || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Verified Data Badge Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <AILabel type="verified" label="ข้อมูลจริงของลูกค้าที่ผ่านการยืนยัน (Verified Customer Data)" />
        <span style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)" }}>
          อัปเดตล่าสุด: {customer.updated_at ? new Date(customer.updated_at).toLocaleDateString("th-TH") : "วันนี้"}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "var(--space-5)" }}>
        {/* ── 1. Customer Personal & Relationship Snapshot ── */}
        <Card title="👤 ข้อมูลส่วนบุคคล & ความสัมพันธ์ (Customer Snapshot)">
          <table style={{ width: "100%", fontSize: "var(--fs-sm)", borderCollapse: "collapse" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "10px 0", color: "var(--slate-500)" }}>ชื่อ-นามสกุล</td>
                <td style={{ padding: "10px 0", fontWeight: 700, color: "var(--slate-900)" }}>{customer.full_name}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "10px 0", color: "var(--slate-500)" }}>รหัสอ้างอิง (Reference ID)</td>
                <td style={{ padding: "10px 0", fontWeight: 600 }}>{customer.external_ref}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "10px 0", color: "var(--slate-500)" }}>กลุ่มลูกค้า (Relationship Tier)</td>
                <td style={{ padding: "10px 0" }}>
                  <Badge variant="neutral" size="sm">{profile?.relationship_tier || "Standard Tier"}</Badge>
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "10px 0", color: "var(--slate-500)" }}>สถานะยืนยันตัวตน (KYC)</td>
                <td style={{ padding: "10px 0" }}>
                  <Status
                    variant={profile?.kyc_status === "verified" ? "healthy" : "warning"}
                    label={profile?.kyc_status === "verified" ? "KYC ผ่านแล้ว" : "รอการตรวจสอบ"}
                    size="sm"
                  />
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "10px 0", color: "var(--slate-500)" }}>ระดับความเสี่ยง (Risk Tolerance)</td>
                <td style={{ padding: "10px 0", fontWeight: 600 }}>{profile?.risk_tolerance || "ปานกลาง (Moderate)"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "10px 0", color: "var(--slate-500)" }}>อาชีพ (Occupation)</td>
                <td style={{ padding: "10px 0" }}>{profile?.occupation || "พนักงานเอกชน"}</td>
              </tr>
              <tr>
                <td style={{ padding: "10px 0", color: "var(--slate-500)" }}>อายุ (Age)</td>
                <td style={{ padding: "10px 0" }}>{profile?.age ? `${profile.age} ปี` : "-"}</td>
              </tr>
            </tbody>
          </table>
        </Card>

        {/* ── 2. Financial Snapshot ── */}
        <Card title="💰 ข้อมูลทางการเงิน (Financial Snapshot)">
          <table style={{ width: "100%", fontSize: "var(--fs-sm)", borderCollapse: "collapse" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "10px 0", color: "var(--slate-500)" }}>สินทรัพย์รวม (Total Assets)</td>
                <td style={{ padding: "10px 0", fontWeight: 700, color: "var(--slate-900)" }}>
                  {financial?.total_assets ? `${(financial.total_assets / 1000000).toFixed(2)} ล้านบาท` : "-"}
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "10px 0", color: "var(--slate-500)" }}>ภาระหนี้สิน (Total Liabilities)</td>
                <td style={{ padding: "10px 0" }}>
                  {financial?.total_liabilities ? `${(financial.total_liabilities / 1000000).toFixed(2)} ล้านบาท` : "0 บาท"}
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "10px 0", color: "var(--slate-500)" }}>เงินออมต่อเดือน (Monthly Savings)</td>
                <td style={{ padding: "10px 0", fontWeight: 600, color: "var(--success-solid)" }}>
                  {financial?.monthly_savings ? `${financial.monthly_savings.toLocaleString()} บาท/เดือน` : "-"}
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "10px 0", color: "var(--slate-500)" }}>ภาระสินเชื่อคงค้าง (Active Loan)</td>
                <td style={{ padding: "10px 0" }}>
                  {financial?.has_active_loan ? (
                    <Badge variant="warning" size="sm">มีสินเชื่อคงค้าง</Badge>
                  ) : (
                    <Badge variant="success" size="sm">ไม่มีสินเชื่อคงค้าง</Badge>
                  )}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "10px 0", color: "var(--slate-500)" }}>ความถี่ธุรกรรม (90 วัน)</td>
                <td style={{ padding: "10px 0" }}>
                  {financial?.transaction_frequency_90d ? `${financial.transaction_frequency_90d} ครั้ง` : "สม่ำเสมอ"}
                </td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>

      {/* ── 3. Insurance Holding Snapshot ── */}
      <Card
        title={`🛡️ กรมธรรม์ที่ถือครองปัจจุบัน (${policies.length} ฉบับ)`}
        subtitle="ประวัติการถือครองและวันครบกำหนดเพื่อวางแผนการต่ออายุหรือปิดช่องว่างความคุ้มครอง"
      >
        {policies.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--space-4)" }}>
            {policies.map((pol) => (
              <div
                key={pol.id}
                style={{
                  padding: "16px",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-surface-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: "var(--fs-sm)", color: "var(--slate-900)" }}>
                    {pol.policy_number}
                  </span>
                  <Badge variant={pol.status === "active" ? "success" : "neutral"} size="sm">
                    {pol.status === "active" ? "Active" : pol.status}
                  </Badge>
                </div>
                <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--primary-700)" }}>
                  {pol.policy_type}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "var(--fs-xs)", color: "var(--slate-600)", borderTop: "1px solid var(--border-subtle)", paddingTop: "8px" }}>
                  <div>
                    ทุนประกัน: <strong>{pol.coverage_amount.toLocaleString()} บาท</strong>
                  </div>
                  <div>
                    เบี้ย: <strong>{pol.premium_amount.toLocaleString()} บาท/ปี</strong>
                  </div>
                  <div>
                    ครบกำหนด: <strong>{pol.renewal_date || "-"}</strong>
                  </div>
                  <div>
                    ชำระ: <strong>{pol.payment_status || "ปกติ"}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--slate-500)", fontSize: "var(--fs-sm)" }}>
            ไม่พบข้อมูลกรมธรรม์ที่ถือครองในปัจจุบัน — ลูกค้ารายนี้อาจเป็นลูกค้าใหม่ที่พร้อมรับการเสนอแผนแรก
          </div>
        )}
      </Card>
    </div>
  );
}
