"use client";
import React, { useState } from "react";
import type { CustomerDetail, CustomerRecommendationsResponse, ProductMatchOut } from "@/types";
import { Card, Badge, Button, Drawer, Modal } from "@/components/ui";
import { AILabel } from "@/components/domain";

interface CustomerRecommendationsProps {
  customer: CustomerDetail;
  recommendations: CustomerRecommendationsResponse | null;
  loading: boolean;
  onRefreshRecommendations: () => void;
  onRecordDecision: (recId: string, action: "approve" | "modify" | "reject", reason?: string, feedback?: string) => Promise<void>;
  decisionLoading: string | null;
}

const ELIGIBILITY_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
  eligible: { label: "✓ ผ่านเกณฑ์ (Eligible)", variant: "success" },
  needs_verification: { label: "⚠️ รอตรวจสอบคุณสมบัติ (Needs Verification)", variant: "warning" },
  ineligible: { label: "✕ ไม่ผ่านเกณฑ์ (Ineligible)", variant: "danger" },
  partial: { label: "⚠️ ผ่านเกณฑ์บางส่วน (Partial)", variant: "warning" },
};

export function CustomerRecommendations({
  recommendations,
  loading,
  onRefreshRecommendations,
  onRecordDecision,
  decisionLoading,
}: CustomerRecommendationsProps) {
  const [comparingProduct, setComparingProduct] = useState<ProductMatchOut | null>(null);
  const [decisionModal, setDecisionModal] = useState<{
    isOpen: boolean;
    recommendationId: string;
    productName: string;
    action: "modify" | "reject";
  } | null>(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [decisionFeedback, setDecisionFeedback] = useState("");

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
    await onRecordDecision(
      decisionModal.recommendationId,
      decisionModal.action,
      decisionReason,
      decisionFeedback
    );
    setDecisionModal(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <div>
          <AILabel type="ai" label="ผลการจับคู่ผลิตภัณฑ์แนะนำ (AI Product Matching)" />
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginLeft: "10px" }}>
            กรองตามเกณฑ์ความเหมาะสม (Hard Gating) และปิดช่องว่างความคุ้มครองเดิม
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon="🔄"
          onClick={onRefreshRecommendations}
          isLoading={loading}
          style={{ color: "var(--primary-700)" }}
        >
          คำนวณคำแนะนำใหม่
        </Button>
      </div>

      {primaryRec ? (
        <>
          {/* ── 1. Primary Recommendation Hero Card ── */}
          <Card
            variant="action"
            title={
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "var(--fs-lg)", fontWeight: 800, color: "var(--slate-900)" }}>
                  {primaryRec.product_name}
                </span>
                <Badge variant="info" size="sm">อันดับ 1 (Top Match)</Badge>
                {primaryRec.category && (
                  <Badge variant="neutral" size="sm">{primaryRec.category}</Badge>
                )}
              </div>
            }
            subtitle={`รหัสผลิตภัณฑ์: ${primaryRec.product_code || primaryRec.product_id} · คะแนนความเหมาะสม: ${Math.round(primaryRec.match_score)}/100`}
            headerAction={
              <Badge
                variant={ELIGIBILITY_CONFIG[primaryRec.eligibility_status]?.variant || "neutral"}
                size="md"
              >
                {ELIGIBILITY_CONFIG[primaryRec.eligibility_status]?.label || primaryRec.eligibility_status}
              </Badge>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
              {/* 4-Part Structured Explanation Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-4)" }}>
                {/* 1. Need Signal */}
                <div style={{ padding: "14px", backgroundColor: "var(--ai-bg)", borderRadius: "var(--radius-md)", border: "1px solid var(--ai-border)" }}>
                  <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--ai-text)", marginBottom: "4px" }}>
                    1. สัญญาณความต้องการ (Need Signal)
                  </div>
                  <div style={{ fontSize: "var(--fs-sm)", color: "var(--slate-800)", lineHeight: 1.5 }}>
                    {primaryRec.structured_explanation?.need_signal || primaryRec.reasons?.[0] || "ตรงกับสัญญาณความคุ้มครองที่ยังขาดหาย"}
                  </div>
                </div>

                {/* 2. Profile Fit */}
                <div style={{ padding: "14px", backgroundColor: "var(--verified-bg)", borderRadius: "var(--radius-md)", border: "1px solid var(--verified-border)" }}>
                  <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--verified-text)", marginBottom: "4px" }}>
                    2. ความเหมาะสมกับโปรไฟล์ (Profile Fit)
                  </div>
                  <div style={{ fontSize: "var(--fs-sm)", color: "var(--slate-800)", lineHeight: 1.5 }}>
                    {primaryRec.structured_explanation?.profile_fit || primaryRec.reasons?.[1] || "ระดับรายได้และช่วงอายุสอดคล้องกับเบี้ยประกัน"}
                  </div>
                </div>

                {/* 3. Eligibility */}
                <div style={{ padding: "14px", backgroundColor: "var(--rule-bg)", borderRadius: "var(--radius-md)", border: "1px solid var(--rule-border)" }}>
                  <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--rule-text)", marginBottom: "4px" }}>
                    3. การตรวจสอบคุณสมบัติ (Eligibility)
                  </div>
                  <div style={{ fontSize: "var(--fs-sm)", color: "var(--slate-800)", lineHeight: 1.5 }}>
                    {primaryRec.structured_explanation?.eligibility_result || (primaryRec.eligibility_status === "eligible" ? "ผ่านเกณฑ์รับประกันทุกข้อ ไม่มีข้อยกเว้น" : "ต้องตรวจสอบข้อมูลเพิ่มเติม")}
                  </div>
                </div>

                {/* 4. Existing Coverage Assessment */}
                <div style={{ padding: "14px", backgroundColor: "var(--broker-bg)", borderRadius: "var(--radius-md)", border: "1px solid var(--broker-border)" }}>
                  <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--broker-text)", marginBottom: "4px" }}>
                    4. ความคุ้มครองเดิม (Coverage Assessment)
                  </div>
                  <div style={{ fontSize: "var(--fs-sm)", color: "var(--slate-800)", lineHeight: 1.5 }}>
                    {primaryRec.structured_explanation?.existing_coverage_assessment || "ไม่ซ้ำซ้อนกับกรมธรรม์เดิมที่ถือครองอยู่"}
                  </div>
                </div>
              </div>

              {/* ── Broker Decision Area (Separated from AI) ── */}
              <div
                style={{
                  padding: "16px 20px",
                  backgroundColor: "var(--slate-50)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "var(--space-4)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "var(--fs-sm)", color: "var(--slate-900)" }}>
                    การตัดสินใจของนายหน้า (Broker Decision)
                  </div>
                  <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "2px" }}>
                    AI แนะนำข้อเสนอข้างต้น · นายหน้าเป็นผู้ตัดสินใจเลือกแนวทางการนำเสนอแก่ลูกค้า
                  </div>
                </div>

                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <Button
                    variant="approve"
                    size="md"
                    leftIcon="✓"
                    onClick={() => onRecordDecision(primaryRec.recommendation_id || primaryRec.product_id, "approve")}
                    isLoading={decisionLoading === (primaryRec.recommendation_id || primaryRec.product_id)}
                  >
                    เห็นชอบ (Approve)
                  </Button>
                  <Button
                    variant="modify"
                    size="md"
                    leftIcon="✎"
                    onClick={() => handleOpenDecisionModal(primaryRec.recommendation_id || primaryRec.product_id, primaryRec.product_name, "modify")}
                  >
                    ปรับเปลี่ยน (Modify)
                  </Button>
                  <Button
                    variant="reject"
                    size="md"
                    leftIcon="✕"
                    onClick={() => handleOpenDecisionModal(primaryRec.recommendation_id || primaryRec.product_id, primaryRec.product_name, "reject")}
                  >
                    ปฏิเสธ (Reject)
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* ── 2. Alternative Eligible Recommendations (Top 3) ── */}
          {alternativeRecs.length > 0 && (
            <Card
              title="แผนทางเลือกอื่นที่ผ่านเกณฑ์ (Eligible Alternatives)"
              subtitle="ผลิตภัณฑ์ทางเลือกที่มีความเหมาะสมรองลงมา สามารถนำมาเปรียบเทียบหรือเสนอทดแทนได้"
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-4)" }}>
                {alternativeRecs.map((alt, i) => (
                  <div
                    key={alt.product_id || i}
                    style={{
                      padding: "16px",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--bg-surface)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontWeight: 700, fontSize: "var(--fs-sm)", color: "var(--slate-900)" }}>
                          {alt.product_name}
                        </div>
                        <Badge variant="neutral" size="sm">คะแนน: {Math.round(alt.match_score)}</Badge>
                      </div>
                      <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "4px" }}>
                        {alt.category} · {alt.product_code}
                      </div>
                      <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-600)", marginTop: "8px", lineHeight: 1.4 }}>
                        {alt.reasons?.[0] || alt.structured_explanation?.need_signal || "แผนทางเลือกที่เหมาะสม"}
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
                      <Badge
                        variant={ELIGIBILITY_CONFIG[alt.eligibility_status]?.variant || "neutral"}
                        size="sm"
                      >
                        {ELIGIBILITY_CONFIG[alt.eligibility_status]?.label || alt.eligibility_status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setComparingProduct(alt)}
                      >
                        ดูรายละเอียด
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <div style={{ padding: "32px", textAlign: "center", color: "var(--slate-500)" }}>
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
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <Badge variant="info" size="md">คะแนนความเหมาะสม: {Math.round(comparingProduct.match_score)}/100</Badge>
              <Badge variant={ELIGIBILITY_CONFIG[comparingProduct.eligibility_status]?.variant || "neutral"} size="md">
                {ELIGIBILITY_CONFIG[comparingProduct.eligibility_status]?.label || comparingProduct.eligibility_status}
              </Badge>
            </div>

            <div style={{ backgroundColor: "var(--slate-50)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontWeight: 700, fontSize: "var(--fs-sm)", marginBottom: "6px" }}>เหตุผลความเหมาะสม</div>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "var(--fs-xs)", color: "var(--slate-700)", lineHeight: 1.6 }}>
                {comparingProduct.reasons?.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>

            {comparingProduct.coverage_range && (
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-700)" }}>
                <strong>ช่วงความคุ้มครอง:</strong> {comparingProduct.coverage_range}
              </div>
            )}

            <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-4)", borderTop: "1px solid var(--border-subtle)", paddingTop: "var(--space-4)" }}>
              <Button
                variant="approve"
                size="md"
                style={{ flex: 1 }}
                onClick={() => {
                  onRecordDecision(comparingProduct.recommendation_id || comparingProduct.product_id, "approve");
                  setComparingProduct(null);
                }}
              >
                เลือกแผนนี้ (เห็นชอบ)
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
                  height: "36px",
                  fontSize: "var(--fs-sm)",
                  padding: "0 10px",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
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
                }}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
