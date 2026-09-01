import React from "react";
import type { CustomerDetail, FollowUpSummary } from "@/types";

interface CustomerAlertsProps {
  customer: CustomerDetail;
  followUps?: FollowUpSummary[];
}

/**
 * Contextual Alert Strip for Customer 360:
 * Displays only active, real-data conditions (overdue follow-ups, pending KYC, active loans).
 */
export function CustomerAlerts({ customer, followUps = [] }: CustomerAlertsProps) {
  const overdueTasks = followUps.filter((f) => f.status === "open" && f.payment_status === "overdue");
  const isKycPending = customer.profile?.kyc_status === "pending";
  const hasActiveLoan = customer.financial_profile?.has_active_loan;
  const isHighPriority = customer.latest_score?.priority_level === "high";

  if (overdueTasks.length === 0 && !isKycPending && !hasActiveLoan && !isHighPriority) {
    return null;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginBottom: "var(--space-5)" }}>
      {/* Overdue Follow-up alert */}
      {overdueTasks.length > 0 && (
        <div
          style={{
            padding: "10px 16px",
            backgroundColor: "var(--danger-bg)",
            border: "1px solid var(--danger-border)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--fs-sm)",
            color: "var(--danger-text)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "16px" }}>⚠️</span>
          <div>
            <strong>มีงานติดตามที่เกินกำหนด {overdueTasks.length} รายการ:</strong> กรุณาตรวจสอบแท็บ "งานติดตาม" เพื่ออัปเดตผลการติดต่อลูกค้า
          </div>
        </div>
      )}

      {/* Pending KYC alert */}
      {isKycPending && (
        <div
          style={{
            padding: "10px 16px",
            backgroundColor: "var(--warning-bg)",
            border: "1px solid var(--warning-border)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--fs-sm)",
            color: "var(--warning-text)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "16px" }}>📋</span>
          <div>
            <strong>สถานะ KYC รอการตรวจสอบ:</strong> ลูกค้ารายนี้ยังอยู่ระหว่างการยืนยันตัวตน กรุณาตรวจสอบเอกสารก่อนทำธุรกรรม
          </div>
        </div>
      )}

      {/* High Priority Opportunity Alert */}
      {isHighPriority && (
        <div
          style={{
            padding: "10px 16px",
            backgroundColor: "var(--ai-bg)",
            border: "1px solid var(--ai-border)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--fs-sm)",
            color: "var(--ai-text)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "16px" }}>⚡</span>
          <div>
            <strong>ลูกค้าความสำคัญสูง (High Priority):</strong> โมเดล AI ประเมินว่าลูกค้ารายนี้มีสัญญาณความต้องการความคุ้มครองที่ควรได้รับการติดต่อในระยะนี้
          </div>
        </div>
      )}
    </div>
  );
}
