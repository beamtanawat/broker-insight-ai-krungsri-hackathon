import React from "react";
import { Badge } from "../ui/Badge";

interface CustomerHeaderProps {
  fullName: string;
  externalRef?: string;
  segment?: string;
  /** e.g. "สูง", "กลาง", "ต่ำ" */
  priorityLabel?: string;
  priorityVariant?: "high" | "medium" | "low";
  lastContact?: string;
  nextFollowUp?: string;
  kycStatus?: "verified" | "pending" | "failed";
  /** Primary action button slot */
  primaryAction?: React.ReactNode;
  style?: React.CSSProperties;
}

const KYC_LABELS: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
  verified: { label: "KYC ผ่านแล้ว", variant: "success" },
  pending:  { label: "KYC รอตรวจสอบ", variant: "warning" },
  failed:   { label: "KYC ไม่ผ่าน", variant: "danger" },
};

/**
 * Customer identity strip — reused at the top of Customer 360 pages.
 * Shows name, ID, segment, priority, KYC status, contact dates, and primary action.
 */
export function CustomerHeader({
  fullName,
  externalRef,
  segment,
  priorityLabel,
  priorityVariant,
  lastContact,
  nextFollowUp,
  kycStatus,
  primaryAction,
  style,
}: CustomerHeaderProps) {
  const kyc = kycStatus ? KYC_LABELS[kycStatus] : null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "var(--space-4)",
        flexWrap: "wrap",
        padding: "20px 24px",
        backgroundColor: "var(--bg-surface)",
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        border: "1px solid var(--border-subtle)",
        borderLeft: "4px solid var(--krungsri-yellow)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-card)",
        ...style,
      }}
    >
      {/* Identity */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: 0, flexWrap: "wrap" }}>
        {/* Avatar initial */}
        <div
          aria-hidden="true"
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            backgroundColor: "#0b1e36",
            border: "2.5px solid var(--krungsri-yellow)",
            color: "var(--krungsri-yellow)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.25rem",
            fontWeight: 800,
            flexShrink: 0,
            boxShadow: "0 4px 14px rgba(11, 30, 54, 0.15)",
          }}
        >
          {fullName?.[0] ?? "?"}
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "#0b1e36",
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
              }}
            >
              {fullName}
            </h2>

            {segment && (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  backgroundColor: "rgba(254, 203, 0, 0.18)",
                  color: "#854d0e",
                  border: "1px solid rgba(254, 203, 0, 0.45)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-full)",
                }}
              >
                ★ {segment}
              </span>
            )}
          </div>

          <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "4px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            {externalRef && (
              <span style={{ fontWeight: 600, color: "var(--slate-600)" }}>
                {externalRef}
              </span>
            )}

            {priorityLabel && priorityVariant && (
              <Badge variant={priorityVariant} size="sm">
                ลำดับ: {priorityLabel}
              </Badge>
            )}

            {kyc && (
              <Badge variant={kyc.variant} size="sm">
                {kyc.label}
              </Badge>
            )}

            {lastContact && (
              <span style={{ color: "var(--slate-500)" }}>
                📞 ติดต่อล่าสุด: <strong style={{ color: "var(--slate-700)" }}>{lastContact}</strong>
              </span>
            )}

            {nextFollowUp && (
              <span style={{ color: "var(--slate-500)" }}>
                📅 นัดหมาย: <strong style={{ color: "var(--slate-700)" }}>{nextFollowUp}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Primary action */}
      {primaryAction && (
        <div style={{ flexShrink: 0, alignSelf: "center" }}>{primaryAction}</div>
      )}
    </div>
  );
}
