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
        alignItems: "flex-start",
        gap: "var(--space-4)",
        flexWrap: "wrap",
        padding: "var(--space-5)",
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-xs)",
        ...style,
      }}
    >
      {/* Identity */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
          {/* Avatar initial */}
          <div
            aria-hidden="true"
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              backgroundColor: "var(--primary-100)",
              color: "var(--primary-700)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "var(--fs-lg)",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {fullName?.[0] ?? "?"}
          </div>

          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "var(--fs-lg)",
                fontWeight: 700,
                color: "var(--slate-900)",
                lineHeight: 1.2,
              }}
            >
              {fullName}
            </h2>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "2px", display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
              {externalRef && <span>{externalRef}</span>}
              {segment && (
                <>
                  <span aria-hidden="true" style={{ color: "var(--slate-300)" }}>·</span>
                  <span>{segment}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status badges row */}
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", marginLeft: "56px" }}>
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
        </div>

        {/* Date metadata */}
        {(lastContact || nextFollowUp) && (
          <div
            style={{
              display: "flex",
              gap: "var(--space-5)",
              fontSize: "var(--fs-xs)",
              color: "var(--slate-500)",
              marginLeft: "56px",
            }}
          >
            {lastContact && (
              <span>
                ติดต่อล่าสุด:{" "}
                <strong style={{ color: "var(--slate-700)" }}>{lastContact}</strong>
              </span>
            )}
            {nextFollowUp && (
              <span>
                นัดหมายถัดไป:{" "}
                <strong style={{ color: "var(--slate-700)" }}>{nextFollowUp}</strong>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Primary action */}
      {primaryAction && (
        <div style={{ flexShrink: 0, alignSelf: "center" }}>{primaryAction}</div>
      )}
    </div>
  );
}
