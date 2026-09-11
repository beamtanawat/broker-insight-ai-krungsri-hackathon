"use client";
import React, { useState } from "react";
import Link from "next/link";
import type { CustomerDetail, CustomerRecommendationsResponse, ProductMatchOut } from "@/types";
import { Card, Badge, Button, Drawer, Modal, Alert, useToast } from "@/components/ui";
import { AILabel } from "@/components/domain";
import { PremiumCalculatorModal } from "./PremiumCalculatorModal";

interface CustomerRecommendationsProps {
  customer: CustomerDetail;
  recommendations: CustomerRecommendationsResponse | null;
  loading: boolean;
  onRefreshRecommendations: () => void | Promise<void>;
  onRecordDecision: (recId: string, action: "approve" | "modify" | "reject" | "reset", reason?: string, feedback?: string) => Promise<void>;
  decisionLoading: string | null;
  notification?: { message: string; variant: "success" | "warning" | "info" } | null;
  onClearNotification?: () => void;
  onNavigateTab?: (tabId: string) => void;
}

const ELIGIBILITY_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
  eligible: { label: "✓ ผ่านเกณฑ์ (Eligible)", variant: "success" },
  needs_verification: { label: "⚠️ รอตรวจสอบคุณสมบัติ (Needs Verification)", variant: "warning" },
  ineligible: { label: "✕ ไม่ผ่านเกณฑ์ (Ineligible)", variant: "danger" },
  partial: { label: "⚠️ ผ่านเกณฑ์บางส่วน (Partial)", variant: "warning" },
};

export function CustomerRecommendations({
  customer,
  recommendations,
  loading,
  onRefreshRecommendations,
  onRecordDecision,
  decisionLoading,
  notification,
  onClearNotification,
  onNavigateTab,
}: CustomerRecommendationsProps) {
  const toast = useToast();
  const [comparingProduct, setComparingProduct] = useState<ProductMatchOut | null>(null);
  const [calculatorProduct, setCalculatorProduct] = useState<ProductMatchOut | null>(null);
  const [decisionModal, setDecisionModal] = useState<{
    isOpen: boolean;
    recommendationId: string;
    productName: string;
    action: "modify" | "reject";
  } | null>(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [decisionFeedback, setDecisionFeedback] = useState("");
  const [editingDecisionId, setEditingDecisionId] = useState<string | null>(null);
  const [localNotification, setLocalNotification] = useState<{ message: string; variant: "success" | "warning" | "info" } | null>(null);

  const activeNotice = notification || localNotification;

  const recList = recommendations?.recommendations || [];
  const primaryRec = recList[0];
  const alternativeRecs = recList.slice(1, 4);

  const handleOpenDecisionModal = (recId: string, productName: string, action: "modify" | "reject") => {
    setDecisionReason(action === "modify" ? "budget_mismatch" : "customer_not_interested");
    setDecisionFeedback("");
    setDecisionModal({
      isOpen: true,
      recommendationId: recId,
      productName,
      action,
    });
  };

  const handleConfirmDecision = async () => {
    if (!decisionModal) return;
    try {
      await onRecordDecision(
        decisionModal.recommendationId,
        decisionModal.action,
        decisionReason,
        decisionFeedback
      );
      const isModify = decisionModal.action === "modify";
      toast.toast({
        message: `บันทึกการ${isModify ? "ปรับเปลี่ยน" : "ปฏิเสธ"}ข้อเสนอสำหรับ "${decisionModal.productName}" สำเร็จ`,
        title: isModify ? "ปรับเปลี่ยนข้อเสนอ" : "ปฏิเสธข้อเสนอ",
        variant: isModify ? "warning" : "info",
      });
      setLocalNotification({
        message: `บันทึกการ${isModify ? "ปรับเปลี่ยน" : "ปฏิเสธ"}ข้อเสนอเรียบร้อยแล้ว`,
        variant: isModify ? "warning" : "info",
      });
      setTimeout(() => setLocalNotification(null), 5000);
      setEditingDecisionId(null);
    } catch (err: any) {
      toast.error(err?.message || "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", "เกิดข้อผิดพลาด");
    } finally {
      setDecisionModal(null);
    }
  };

  const handleDirectApprove = async (rec: ProductMatchOut) => {
    const id = rec.recommendation_id || rec.product_id;
    try {
      await onRecordDecision(id, "approve");
      toast.success(`บันทึกความเห็นชอบ (Approve) สำหรับ "${rec.product_name}" สำเร็จ`, "บันทึกผลการตัดสินใจ");
      setLocalNotification({
        message: `บันทึกความเห็นชอบ (Approve) สำหรับ "${rec.product_name}" สำเร็จ`,
        variant: "success",
      });
      setTimeout(() => setLocalNotification(null), 5000);
      setEditingDecisionId(null);
    } catch (err: any) {
      toast.error(err?.message || "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", "เกิดข้อผิดพลาด");
      setLocalNotification({
        message: err?.message || "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
        variant: "warning",
      });
    }
  };

  return (
    <div id="recommendation-workspace" style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* ── Active Notification Banner ── */}
      {activeNotice && (
        <Alert
          variant={activeNotice.variant}
          onClose={() => {
            if (onClearNotification) onClearNotification();
            setLocalNotification(null);
          }}
        >
          {activeNotice.message}
        </Alert>
      )}

      {/* ── Gen Z Customer Experience Bridge for Pearl (KS-00002) ── */}
      {customer.external_ref === "KS-00002" && (
        <div
          style={{
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "12px",
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            boxShadow: "0 2px 8px rgba(37, 99, 235, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "#dbeafe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                flexShrink: 0,
              }}
            >
              📱
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#1e40af", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>ลูกค้า Gen Z รายนี้เข้ามาสำรวจความต้องการผ่านหน้า My Protection แล้ว</span>
                <span style={{ fontSize: "11px", backgroundColor: "#2563eb", color: "#ffffff", padding: "1px 7px", borderRadius: "999px" }}>
                  Digital Intent
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#3b82f6", marginTop: "2px" }}>
                🔔 <strong>Why now trigger:</strong> ต่อประกันรถยนต์ใน 21 วัน และกำลังทบทวนช่องว่างประกันกลุ่มบริษัท (ไม่ต้องการซื้อประกันชีวิต)
              </div>
            </div>
          </div>
          <Link href="/my-protection" style={{ textDecoration: "none" }}>
            <Button variant="primary" size="sm" leftIcon="📱">
              เปิดดูมุมมองลูกค้า (My Protection) →
            </Button>
          </Link>
        </div>
      )}

      {/* ── Header Bar with Refresh Action ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <AILabel type="ai" label="ผลการจับคู่ผลิตภัณฑ์แนะนำ (AI Product Matching)" />
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)" }}>
            กรองตามเกณฑ์ความเหมาะสม (Hard Gating) และปิดช่องว่างความคุ้มครองเดิม
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={loading ? "⏳" : "🔄"}
          onClick={onRefreshRecommendations}
          isLoading={loading}
          style={{
            borderColor: "var(--primary-300)",
            color: "var(--primary-700)",
            backgroundColor: "var(--primary-50)",
            fontWeight: 600,
          }}
        >
          {loading ? "กำลังคำนวณ..." : "คำนวณคำแนะนำใหม่"}
        </Button>
      </div>

      {primaryRec ? (
        <>
          {/* ── 1. Primary Recommendation Hero Card ── */}
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-card)",
              overflow: "hidden",
              position: "relative",
              transition: "box-shadow var(--motion-normal) ease",
            }}
          >
            {/* Krungsri Gold Accent Strip */}
            <div
              style={{
                height: "4px",
                background: "var(--krungsri-gold-gradient)",
                width: "100%",
              }}
            />

            {/* Hero Card Header */}
            <div
              style={{
                padding: "var(--space-5) var(--space-6)",
                borderBottom: "1px solid var(--border-subtle)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "var(--space-4)",
                backgroundColor: "linear-gradient(180deg, #ffffff 0%, var(--slate-50) 100%)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "3px 10px",
                      background: "var(--krungsri-gold-gradient)",
                      color: "var(--krungsri-navy)",
                      fontSize: "11px",
                      fontWeight: 800,
                      borderRadius: "var(--radius-full)",
                      letterSpacing: "0.03em",
                      boxShadow: "0 1px 3px rgba(254, 203, 0, 0.35)",
                    }}
                  >
                    ⭐ อันดับ 1 (Top AI Match)
                  </span>
                  {primaryRec.category && (
                    <Badge variant="neutral" size="sm">{primaryRec.category}</Badge>
                  )}
                </div>

                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--slate-900)", margin: 0, letterSpacing: "-0.01em" }}>
                  {primaryRec.product_name}
                </h3>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "4px" }}>
                  รหัสผลิตภัณฑ์: <strong style={{ color: "var(--slate-700)" }}>{primaryRec.product_code || primaryRec.product_id}</strong>
                  {primaryRec.coverage_range && (
                    <span> · วงเงินคุ้มครอง: <strong style={{ color: "var(--slate-700)" }}>{primaryRec.coverage_range}</strong></span>
                  )}
                </div>
              </div>

              {/* Match Score & Eligibility Badges */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "8px 14px",
                    backgroundColor: "var(--krungsri-navy-subtle)",
                    border: "1px solid rgba(11, 30, 54, 0.08)",
                    borderRadius: "var(--radius-lg)",
                  }}
                >
                  <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--krungsri-navy)", opacity: 0.8 }}>
                    คะแนนความเหมาะสม
                  </span>
                  <span style={{ fontSize: "1.35rem", fontWeight: 900, color: "var(--krungsri-navy)", lineHeight: 1.1 }}>
                    {Math.round(primaryRec.match_score)}<span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--slate-500)" }}>/100</span>
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon="🧮"
                    onClick={() => setCalculatorProduct(primaryRec)}
                    style={{
                      borderColor: "var(--krungsri-yellow)",
                      color: "var(--krungsri-navy)",
                      backgroundColor: "#ffffff",
                      fontWeight: 700,
                    }}
                  >
                    จำลองการคำนวณเบี้ย
                  </Button>
                  <Badge
                    variant={ELIGIBILITY_CONFIG[primaryRec.eligibility_status]?.variant || "neutral"}
                    size="md"
                  >
                    {ELIGIBILITY_CONFIG[primaryRec.eligibility_status]?.label || primaryRec.eligibility_status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Hero Card Body */}
            <div style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
              {/* 4-Part Structured Explanation Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-4)" }}>
                {/* 1. Need Signal */}
                <div
                  className="hover-lift"
                  style={{
                    padding: "16px",
                    backgroundColor: "var(--ai-bg)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--ai-border)",
                    boxShadow: "var(--shadow-xs)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--ai-text)", marginBottom: "6px" }}>
                    <span>🎯</span> 1. สัญญาณความต้องการ (Need Signal)
                  </div>
                  <div style={{ fontSize: "var(--fs-sm)", color: "var(--slate-800)", lineHeight: 1.55 }}>
                    {primaryRec.structured_explanation?.need_signal || primaryRec.reasons?.[0] || "ตรงกับสัญญาณความคุ้มครองที่ยังขาดหาย"}
                  </div>
                </div>

                {/* 2. Profile Fit */}
                <div
                  className="hover-lift"
                  style={{
                    padding: "16px",
                    backgroundColor: "var(--verified-bg)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--verified-border)",
                    boxShadow: "var(--shadow-xs)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--verified-text)", marginBottom: "6px" }}>
                    <span>👤</span> 2. ความเหมาะสมกับโปรไฟล์ (Profile Fit)
                  </div>
                  <div style={{ fontSize: "var(--fs-sm)", color: "var(--slate-800)", lineHeight: 1.55 }}>
                    {primaryRec.structured_explanation?.profile_fit || primaryRec.reasons?.[1] || "ระดับรายได้และช่วงอายุสอดคล้องกับเบี้ยประกัน"}
                  </div>
                </div>

                {/* 3. Eligibility */}
                <div
                  className="hover-lift"
                  style={{
                    padding: "16px",
                    backgroundColor: "var(--rule-bg)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--rule-border)",
                    boxShadow: "var(--shadow-xs)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--rule-text)", marginBottom: "6px" }}>
                    <span>⚖️</span> 3. การตรวจสอบคุณสมบัติ (Eligibility)
                  </div>
                  <div style={{ fontSize: "var(--fs-sm)", color: "var(--slate-800)", lineHeight: 1.55 }}>
                    {primaryRec.structured_explanation?.eligibility_result || (primaryRec.eligibility_status === "eligible" ? "ผ่านเกณฑ์รับประกันทุกข้อ ไม่มีข้อยกเว้น" : "ต้องตรวจสอบข้อมูลเพิ่มเติม")}
                  </div>
                </div>

                {/* 4. Existing Coverage Assessment */}
                <div
                  className="hover-lift"
                  style={{
                    padding: "16px",
                    backgroundColor: "var(--broker-bg)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--broker-border)",
                    boxShadow: "var(--shadow-xs)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--broker-text)", marginBottom: "6px" }}>
                    <span>🛡️</span> 4. ความคุ้มครองเดิม (Coverage Assessment)
                  </div>
                  <div style={{ fontSize: "var(--fs-sm)", color: "var(--slate-800)", lineHeight: 1.55 }}>
                    {primaryRec.structured_explanation?.existing_coverage_assessment || "ไม่ซ้ำซ้อนกับกรมธรรม์เดิมที่ถือครองอยู่"}
                  </div>
                </div>
              </div>

              {/* ── Interactive Broker Decision Area (Status-Aware) ── */}
              {primaryRec.status === "accepted" && editingDecisionId !== (primaryRec.recommendation_id || primaryRec.product_id) ? (
                <div
                  style={{
                    padding: "18px 24px",
                    background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                    border: "1.5px solid #22c55e",
                    borderRadius: "var(--radius-lg)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "var(--space-3)",
                    boxShadow: "0 2px 8px rgba(34, 197, 94, 0.15)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#16a34a", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", fontWeight: "bold", boxShadow: "0 2px 6px rgba(22, 163, 74, 0.3)" }}>
                      ✓
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", color: "#14532d" }}>
                        โบรกเกอร์บันทึกความเห็นชอบแล้ว (Approved)
                      </div>
                      <div style={{ fontSize: "var(--fs-xs)", color: "#166534", marginTop: "2px" }}>
                        แผนนี้พร้อมสำหรับการจัดเตรียมข้อเสนอและนำเสนอแก่ลูกค้าเรียบร้อยแล้ว
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                    {onNavigateTab && (
                      <Button
                        variant="approve"
                        size="sm"
                        leftIcon="💬"
                        onClick={() => onNavigateTab("prep")}
                      >
                        เตรียมบทสนทนา (Prep)
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon="✎"
                      onClick={() => setEditingDecisionId(primaryRec.recommendation_id || primaryRec.product_id)}
                      style={{ borderColor: "#86efac", color: "#166534", backgroundColor: "white" }}
                    >
                      เปลี่ยนการตัดสินใจ
                    </Button>
                  </div>
                </div>
              ) : primaryRec.status === "modified" && editingDecisionId !== (primaryRec.recommendation_id || primaryRec.product_id) ? (
                <div
                  style={{
                    padding: "18px 24px",
                    background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                    border: "1.5px solid #f59e0b",
                    borderRadius: "var(--radius-lg)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "var(--space-3)",
                    boxShadow: "0 2px 8px rgba(245, 158, 11, 0.15)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#d97706", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.15rem", fontWeight: "bold", boxShadow: "0 2px 6px rgba(217, 119, 6, 0.3)" }}>
                      ✎
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", color: "#78350f" }}>
                        ปรับเปลี่ยนข้อเสนอแล้ว (Modified)
                      </div>
                      <div style={{ fontSize: "var(--fs-xs)", color: "#92400e", marginTop: "2px" }}>
                        บันทึกเหตุผลการปรับเปลี่ยนแผนลงระบบเรียบร้อย
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon="✎"
                    onClick={() => setEditingDecisionId(primaryRec.recommendation_id || primaryRec.product_id)}
                    style={{ borderColor: "#fde68a", color: "#92400e", backgroundColor: "white" }}
                  >
                    เปลี่ยนการตัดสินใจ
                  </Button>
                </div>
              ) : primaryRec.status === "declined" && editingDecisionId !== (primaryRec.recommendation_id || primaryRec.product_id) ? (
                <div
                  style={{
                    padding: "18px 24px",
                    background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
                    border: "1.5px solid #ef4444",
                    borderRadius: "var(--radius-lg)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "var(--space-3)",
                    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.15)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#dc2626", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.15rem", fontWeight: "bold", boxShadow: "0 2px 6px rgba(220, 38, 38, 0.3)" }}>
                      ✕
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", color: "#7f1d1d" }}>
                        ปฏิเสธข้อเสนอนี้แล้ว (Declined)
                      </div>
                      <div style={{ fontSize: "var(--fs-xs)", color: "#991b1b", marginTop: "2px" }}>
                        บันทึกเหตุผลการปฏิเสธเพื่อนำไปปรับปรุงโมเดลแนะนำ AI ถัดไป
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon="✎"
                    onClick={() => setEditingDecisionId(primaryRec.recommendation_id || primaryRec.product_id)}
                    style={{ borderColor: "#fecaca", color: "#991b1b", backgroundColor: "white" }}
                  >
                    เปลี่ยนการตัดสินใจ
                  </Button>
                </div>
              ) : (
                <div
                  style={{
                    padding: "18px 24px",
                    backgroundColor: "var(--slate-50)",
                    border: "1.5px solid var(--border-subtle)",
                    borderRadius: "var(--radius-lg)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "var(--space-4)",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", color: "var(--krungsri-navy)" }}>
                      การตัดสินใจของนายหน้า (Broker Decision)
                    </div>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "2px" }}>
                      AI เสนอข้อเสนอที่เหมาะสมที่สุด · นายหน้าพิจารณาเลือกแนวทางตอบรับเพื่อเตรียมการเสนอขาย
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                    <Button
                      variant="approve"
                      size="md"
                      leftIcon="✓"
                      onClick={() => handleDirectApprove(primaryRec)}
                      isLoading={decisionLoading === (primaryRec.recommendation_id || primaryRec.product_id)}
                    >
                      เห็นชอบ (Approve)
                    </Button>
                    <Button
                      variant="modify"
                      size="md"
                      leftIcon="✎"
                      onClick={() => handleOpenDecisionModal(primaryRec.recommendation_id || primaryRec.product_id, primaryRec.product_name, "modify")}
                      isLoading={decisionLoading === (primaryRec.recommendation_id || primaryRec.product_id)}
                    >
                      ปรับเปลี่ยน (Modify)
                    </Button>
                    <Button
                      variant="reject"
                      size="md"
                      leftIcon="✕"
                      onClick={() => handleOpenDecisionModal(primaryRec.recommendation_id || primaryRec.product_id, primaryRec.product_name, "reject")}
                      isLoading={decisionLoading === (primaryRec.recommendation_id || primaryRec.product_id)}
                    >
                      ปฏิเสธ (Reject)
                    </Button>
                    {editingDecisionId && (
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => setEditingDecisionId(null)}
                      >
                        ยกเลิก
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── 2. Alternative Eligible Recommendations ── */}
          {alternativeRecs.length > 0 && (
            <div
              style={{
                backgroundColor: "var(--bg-surface)",
                borderRadius: "var(--radius-xl)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-card)",
                padding: "var(--space-6)",
              }}
            >
              <div style={{ marginBottom: "var(--space-4)" }}>
                <h4 style={{ fontSize: "var(--fs-md)", fontWeight: 800, color: "var(--krungsri-navy)", margin: 0 }}>
                  แผนทางเลือกอื่นที่ผ่านเกณฑ์ (Eligible Alternatives)
                </h4>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "2px" }}>
                  ผลิตภัณฑ์ทางเลือกที่มีความเหมาะสมรองลงมา สามารถนำมาเปรียบเทียบหรือเสนอทดแทนได้
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--space-4)" }}>
                {alternativeRecs.map((alt, i) => {
                  const altId = alt.recommendation_id || alt.product_id;
                  const isAltApproved = alt.status === "accepted";
                  return (
                    <div
                      key={altId || i}
                      className="hover-lift"
                      style={{
                        padding: "20px",
                        border: isAltApproved ? "2px solid #22c55e" : "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-lg)",
                        backgroundColor: isAltApproved ? "#f0fdf4" : "var(--bg-surface)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: "14px",
                        boxShadow: isAltApproved ? "0 4px 12px rgba(34, 197, 94, 0.15)" : "var(--shadow-xs)",
                        transition: "all var(--motion-normal) ease",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                          <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", color: "var(--slate-900)" }}>
                            {alt.product_name}
                          </div>
                          <Badge variant={isAltApproved ? "success" : "neutral"} size="sm">
                            {isAltApproved ? "✓ เลือกแล้ว" : `คะแนน: ${Math.round(alt.match_score)}`}
                          </Badge>
                        </div>
                        <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "4px" }}>
                          {alt.category} · {alt.product_code}
                        </div>
                        <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-600)", marginTop: "8px", lineHeight: 1.5 }}>
                          {alt.reasons?.[0] || alt.structured_explanation?.need_signal || "แผนทางเลือกที่สอดคล้องกับคุณสมบัติ"}
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px", gap: "8px" }}>
                        <Badge
                          variant={ELIGIBILITY_CONFIG[alt.eligibility_status]?.variant || "neutral"}
                          size="sm"
                        >
                          {ELIGIBILITY_CONFIG[alt.eligibility_status]?.label || alt.eligibility_status}
                        </Badge>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setComparingProduct(alt)}
                          >
                            ดูรายละเอียด
                          </Button>
                          <Button
                            variant={isAltApproved ? "secondary" : "approve"}
                            size="sm"
                            onClick={() => handleDirectApprove(alt)}
                            isLoading={decisionLoading === altId}
                          >
                            {isAltApproved ? "✓ เลือกแล้ว" : "เลือกแผนนี้"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <Card>
          <div style={{ padding: "40px", textAlign: "center", color: "var(--slate-500)" }}>
            {loading ? "กำลังประมวลผลคำแนะนำผลิตภัณฑ์..." : "ยังไม่มีข้อมูลคำแนะนำสำหรับลูกค้ารายนี้ กรุณากดปุ่ม 'คำนวณคำแนะนำใหม่'"}
          </div>
        </Card>
      )}

      {/* ── Product Comparison Drawer ── */}
      {comparingProduct && (
        <Drawer
          isOpen={Boolean(comparingProduct)}
          onClose={() => setComparingProduct(null)}
          title={`รายละเอียดผลิตภัณฑ์: ${comparingProduct.product_name}`}
          subtitle={`รหัส: ${comparingProduct.product_code || comparingProduct.product_id} · หมวดหมู่: ${comparingProduct.category}`}
          width="540px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
              <Badge variant="info" size="md">คะแนนความเหมาะสม: {Math.round(comparingProduct.match_score)}/100</Badge>
              <Badge variant={ELIGIBILITY_CONFIG[comparingProduct.eligibility_status]?.variant || "neutral"} size="md">
                {ELIGIBILITY_CONFIG[comparingProduct.eligibility_status]?.label || comparingProduct.eligibility_status}
              </Badge>
              {comparingProduct.status === "accepted" && (
                <Badge variant="success" size="md">✓ เห็นชอบแล้ว</Badge>
              )}
            </div>

            <div style={{ backgroundColor: "var(--slate-50)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontWeight: 700, fontSize: "var(--fs-sm)", marginBottom: "8px", color: "var(--slate-900)" }}>
                เหตุผลความเหมาะสมและการจับคู่ (Need Matching)
              </div>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "var(--fs-xs)", color: "var(--slate-700)", lineHeight: 1.6 }}>
                {comparingProduct.reasons?.map((r, idx) => (
                  <li key={idx} style={{ marginBottom: "4px" }}>{r}</li>
                ))}
              </ul>
            </div>

            {comparingProduct.structured_explanation && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-3)" }}>
                {comparingProduct.structured_explanation.need_signal && (
                  <div style={{ padding: "12px", backgroundColor: "var(--ai-bg)", borderRadius: "var(--radius-md)", border: "1px solid var(--ai-border)" }}>
                    <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--ai-text)", marginBottom: "2px" }}>
                      สัญญาณความต้องการ
                    </div>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-800)" }}>
                      {comparingProduct.structured_explanation.need_signal}
                    </div>
                  </div>
                )}
                {comparingProduct.structured_explanation.profile_fit && (
                  <div style={{ padding: "12px", backgroundColor: "var(--verified-bg)", borderRadius: "var(--radius-md)", border: "1px solid var(--verified-border)" }}>
                    <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--verified-text)", marginBottom: "2px" }}>
                      ความเหมาะสมกับโปรไฟล์
                    </div>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-800)" }}>
                      {comparingProduct.structured_explanation.profile_fit}
                    </div>
                  </div>
                )}
              </div>
            )}

            {comparingProduct.coverage_range && (
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-700)", padding: "10px", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
                <strong>ช่วงความคุ้มครอง:</strong> {comparingProduct.coverage_range}
              </div>
            )}

            <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-4)", borderTop: "1px solid var(--border-subtle)", paddingTop: "var(--space-4)", flexWrap: "wrap" }}>
              <Button
                variant="gold"
                size="md"
                leftIcon="🧮"
                onClick={() => setCalculatorProduct(comparingProduct)}
              >
                คำนวณเบี้ย
              </Button>
              <Button
                variant="approve"
                size="md"
                style={{ flex: 1 }}
                onClick={async () => {
                  await handleDirectApprove(comparingProduct);
                  setComparingProduct(null);
                }}
                isLoading={decisionLoading === (comparingProduct.recommendation_id || comparingProduct.product_id)}
              >
                เลือกแผนนี้ (เห็นชอบ)
              </Button>
              <Button
                variant="modify"
                size="md"
                onClick={() => {
                  const target = comparingProduct;
                  setComparingProduct(null);
                  handleOpenDecisionModal(target.recommendation_id || target.product_id, target.product_name, "modify");
                }}
              >
                ปรับเปลี่ยน
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setComparingProduct(null)}
              >
                ปิด
              </Button>
            </div>
          </div>
        </Drawer>
      )}

      {/* ── Modify / Reject Decision Modal ── */}
      {decisionModal && (
        <Modal
          isOpen={decisionModal.isOpen}
          onClose={() => setDecisionModal(null)}
          title={decisionModal.action === "modify" ? "ปรับเปลี่ยนข้อเสนอ (Modify Proposal)" : "ปฏิเสธข้อเสนอ (Reject Proposal)"}
          subtitle={`ผลิตภัณฑ์: ${decisionModal.productName}`}
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={() => setDecisionModal(null)}>
                ยกเลิก
              </Button>
              <Button
                variant={decisionModal.action === "modify" ? "modify" : "reject"}
                size="sm"
                onClick={handleConfirmDecision}
                isLoading={Boolean(decisionLoading)}
              >
                ยืนยันการตัดสินใจ
              </Button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div>
              <label style={{ display: "block", fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--slate-700)", marginBottom: "6px" }}>
                เหตุผลในการ{decisionModal.action === "modify" ? "ปรับเปลี่ยน" : "ปฏิเสธ"}:
              </label>
              <select
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                style={{
                  width: "100%",
                  height: "38px",
                  fontSize: "var(--fs-sm)",
                  padding: "0 10px",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-surface)",
                  color: "var(--slate-800)",
                }}
              >
                {decisionModal.action === "modify" ? (
                  <>
                    <option value="budget_mismatch">เบี้ยประกันไม่ตรงกับงบประมาณลูกค้า</option>
                    <option value="prefer_other_rider">ลูกค้าต้องการสัญญาเพิ่มเติมแบบอื่น</option>
                    <option value="coverage_duration">ระยะเวลาความคุ้มครองไม่ตรงความต้องการ</option>
                    <option value="existing_alternative">มีกรมธรรม์อื่นที่ครอบคลุมอยู่แล้ว</option>
                    <option value="other">เหตุผลอื่น ๆ</option>
                  </>
                ) : (
                  <>
                    <option value="customer_not_interested">ลูกค้าไม่สนใจผลิตภัณฑ์หมวดนี้</option>
                    <option value="recent_rejection">เพิ่งปฏิเสธข้อเสนอไปเมื่อเร็ว ๆ นี้</option>
                    <option value="health_underwriting">มีเงื่อนไขด้านสุขภาพที่ไม่ผ่านเกณฑ์</option>
                    <option value="other">เหตุผลอื่น ๆ</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--slate-700)", marginBottom: "6px" }}>
                บันทึกข้อคิดเห็นเพิ่มเติม (Feedback Notes):
              </label>
              <textarea
                rows={3}
                placeholder="ระบุข้อคิดเห็นเพื่อเป็นประโยชน์ต่อการปรับปรุงโมเดล AI..."
                value={decisionFeedback}
                onChange={(e) => setDecisionFeedback(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "var(--fs-sm)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  resize: "vertical",
                  backgroundColor: "var(--bg-surface)",
                  color: "var(--slate-800)",
                }}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* ── Premium Calculator Modal ── */}
      {calculatorProduct && (
        <PremiumCalculatorModal
          isOpen={Boolean(calculatorProduct)}
          onClose={() => setCalculatorProduct(null)}
          product={calculatorProduct}
          customerName={customer.full_name}
          onApplyEstimatedPremium={(amount) => {
            toast.success(`บันทึกการประมาณการเบี้ยประกัน ${amount.toLocaleString()} บาท/ปี เรียบร้อย`, "เครื่องมือคำนวณเบี้ย");
          }}
        />
      )}
    </div>
  );
}

