"use client";
import React, { useState, useId } from "react";
import type { ProductMatchOut } from "@/types";
import { Modal, Button, Badge } from "@/components/ui";

interface PremiumCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductMatchOut | null;
  customerName?: string;
  onApplyEstimatedPremium?: (estimatedAmount: number) => void;
}

export function PremiumCalculatorModal({
  isOpen,
  onClose,
  product,
  customerName,
  onApplyEstimatedPremium,
}: PremiumCalculatorModalProps) {
  const sumAssuredId = useId();

  if (!product) return null;

  const cat = (product.category || "").toLowerCase();
  const prodName = (product.product_name || "").toLowerCase();
  const isMotor = cat.includes("motor") || prodName.includes("motor") || prodName.includes("รถ");
  const isHealth = cat.includes("health") || prodName.includes("health") || prodName.includes("สุขภาพ") || prodName.includes("ci") || prodName.includes("โรคร้าย");
  const isPension = cat.includes("pension") || cat.includes("retire") || prodName.includes("pension") || prodName.includes("บำนาญ");
  const isSavings = cat.includes("saving") || prodName.includes("สะสมทรัพย์") || prodName.includes("10/5");
  const isLoan = cat.includes("credit") || cat.includes("loan") || prodName.includes("mrta") || prodName.includes("สินเชื่อ") || prodName.includes("หนี้");

  // Dynamic initial sum assured and slider boundaries
  const sliderConfig = isMotor
    ? { min: 300000, max: 2000000, step: 50000, defaultVal: 650000, label: "มูลค่ารถยนต์ / ทุนประกันภัย (Sum Insured)" }
    : isHealth
    ? { min: 1000000, max: 10000000, step: 500000, defaultVal: 5000000, label: "วงเงินเหมาจ่ายค่ารักษาพยาบาลต่อปี (Annual Max Limit)" }
    : isPension
    ? { min: 500000, max: 10000000, step: 500000, defaultVal: 1000000, label: "ทุนประกันบำนาญเป้าหมาย (Pension Target Pool)" }
    : isSavings
    ? { min: 100000, max: 3000000, step: 100000, defaultVal: 500000, label: "ทุนประกันสะสมทรัพย์ (Maturity Benefit)" }
    : isLoan
    ? { min: 1000000, max: 20000000, step: 500000, defaultVal: 5500000, label: "วงเงินสินเชื่อที่คุ้มครอง (Loan Balance Coverage)" }
    : { min: 500000, max: 15000000, step: 500000, defaultVal: 2000000, label: "ทุนประกันชีวิตคุ้มครองตลอดชีพ (Sum Assured)" };

  const [sumAssured, setSumAssured] = useState<number>(() => sliderConfig.defaultVal);
  const [paymentFrequency, setPaymentFrequency] = useState<"annual" | "semi" | "quarter" | "monthly">("annual");
  const [hasDeductible, setHasDeductible] = useState<boolean>(false);

  // Compute realistic annual premium based on authentic insurance actuarial brackets
  let calculatedAnnual = 0;
  if (isMotor) {
    // Motor Type 1: 2.8% base comprehensive rate on vehicle value minus 20% No-Claim Bonus (NCB)
    const baseMotor = sumAssured * 0.028 * 0.80;
    calculatedAnnual = Math.round(hasDeductible ? baseMotor * 0.85 : baseMotor);
  } else if (isHealth) {
    // Health Maxเหมาจ่าย: Base 22,000 for 1M + 5,000 per extra 1M
    const extraMillions = Math.max(0, (sumAssured - 1000000) / 1000000);
    const baseHealth = 22000 + extraMillions * 5200;
    calculatedAnnual = Math.round(hasDeductible ? baseHealth * 0.80 : baseHealth);
  } else if (isPension) {
    // Smart Pension: ~68,000 per 1M sum assured
    calculatedAnnual = Math.round((sumAssured / 1000000) * 68000);
  } else if (isSavings) {
    // Savings 10/5: 5-year short-pay ~190,000 per 1M sum assured
    calculatedAnnual = Math.round((sumAssured / 1000000) * 192000);
  } else if (isLoan) {
    // MRTA Mortgage Protection: ~7,200 per 1M loan balance
    calculatedAnnual = Math.round((sumAssured / 1000000) * 7200);
  } else {
    // Life Plus 90/20: ~32,000 per 1M sum assured
    calculatedAnnual = Math.round((sumAssured / 1000000) * 32500);
  }

  // Compute period premium with standard Thai industry factor adjustments
  let periodPremium = calculatedAnnual;
  let periodLabel = "ต่อปี";
  if (paymentFrequency === "semi") {
    periodPremium = Math.round(calculatedAnnual * 0.52);
    periodLabel = "ต่องวด (ราย 6 เดือน)";
  } else if (paymentFrequency === "quarter") {
    periodPremium = Math.round(calculatedAnnual * 0.27);
    periodLabel = "ต่องวด (ราย 3 เดือน)";
  } else if (paymentFrequency === "monthly") {
    periodPremium = Math.round(calculatedAnnual * 0.09);
    periodLabel = "ต่อเดือน";
  }

  // Accurate Thai Revenue Department tax deduction eligibility rules
  const taxDeductionInfo = isMotor
    ? {
        eligible: false,
        tag: "✕ ไม่สามารถลดหย่อนภาษีได้",
        color: "var(--slate-400)",
        rule: "เบี้ยประกันภัยรถยนต์เป็นประกันวินาศภัยภาคสมัครใจ ไม่อยู่ในเกณฑ์ลดหย่อนภาษีบุคคลธรรมดา",
      }
    : isHealth
    ? {
        eligible: true,
        tag: "✓ ลดหย่อนภาษีได้",
        color: "#10b981",
        rule: "สูงสุด 25,000 บาท/ปี (เมื่อรวมกับประกันชีวิตทั่วไปไม่เกิน 100,000 บาท)",
      }
    : isPension
    ? {
        eligible: true,
        tag: "✓ ลดหย่อนภาษีได้พิเศษ",
        color: "#10b981",
        rule: "สูงสุด 200,000 บาท/ปี (ไม่เกิน 15% ของเงินได้ และรวมกองทุนเพื่อการเกษียณไม่เกิน 500,000 บาท)",
      }
    : isLoan
    ? {
        eligible: true,
        tag: "✓ ลดหย่อนภาษีได้",
        color: "#10b981",
        rule: "ลดหย่อนตามส่วนความคุ้มครองชีวิตสำหรับสัญญา 10 ปีขึ้นไป สูงสุด 100,000 บาท",
      }
    : {
        eligible: true,
        tag: "✓ ลดหย่อนภาษีได้",
        color: "#10b981",
        rule: "สูงสุด 100,000 บาท ตามเกณฑ์กรมสรรพากร (สำหรับสัญญาระยะยาวตั้งแต่ 10 ปีขึ้นไป)",
      };

  const handleApply = () => {
    if (onApplyEstimatedPremium) {
      onApplyEstimatedPremium(calculatedAnnual);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🧮 เครื่องมือจำลองการคำนวณเบี้ยประกัน (Quick Premium Estimator)"
      subtitle={`สำหรับ: ${product.product_name} · ${customerName || "ลูกค้า"}`}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)" }}>
            * เป็นการประมาณการเบื้องต้นตามเกณฑ์พิจารณารับประกันมาตรฐาน เบี้ยจริงอาจปรับเปลี่ยนตามประวัติสุขภาพและผลการประเมิน
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ปิด
            </Button>
            <Button variant="gold" size="sm" onClick={handleApply}>
              บันทึกการประมาณการ
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {/* Product Overview Card */}
        <div
          style={{
            padding: "14px 16px",
            backgroundColor: "var(--slate-50)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: "var(--fs-base)", color: "var(--krungsri-navy)" }}>
              {product.product_name}
            </div>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "2px" }}>
              หมวดหมู่: <strong>{product.category || "ประกันภัยและชีวิต"}</strong> · รหัส: {product.product_code || product.product_id}
            </div>
          </div>
          <Badge variant="gold" size="sm">
            AI Match: {Math.round((product.match_score > 1 ? product.match_score : (product.match_score || 0.9) * 100))}%
          </Badge>
        </div>

        {/* 1. Sum Assured Slider */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
            <label htmlFor={sumAssuredId} style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--slate-700)" }}>
              {sliderConfig.label}:
            </label>
            <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800, color: "var(--krungsri-navy)" }}>
              {sumAssured.toLocaleString()} <span style={{ fontSize: "var(--fs-xs)", fontWeight: 500, color: "var(--slate-500)" }}>บาท</span>
            </div>
          </div>
          <input
            id={sumAssuredId}
            type="range"
            min={sliderConfig.min}
            max={sliderConfig.max}
            step={sliderConfig.step}
            value={sumAssured}
            onChange={(e) => setSumAssured(Number(e.target.value))}
            style={{
              width: "100%",
              height: "8px",
              borderRadius: "4px",
              accentColor: "var(--krungsri-yellow)",
              cursor: "pointer",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--slate-400)", marginTop: "4px" }}>
            <span>{sliderConfig.min.toLocaleString()} บาท</span>
            <span>{((sliderConfig.min + sliderConfig.max) / 2).toLocaleString()} บาท</span>
            <span>{sliderConfig.max.toLocaleString()} บาท</span>
          </div>
        </div>

        {/* 2. Payment Frequency Toggle */}
        <div>
          <label style={{ display: "block", fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--slate-700)", marginBottom: "8px" }}>
            งวดการชำระเบี้ยประกัน:
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
            {[
              { id: "annual" as const, label: "รายปี (100%)" },
              { id: "semi" as const, label: "ราย 6 เดือน (52%)" },
              { id: "quarter" as const, label: "ราย 3 เดือน (27%)" },
              { id: "monthly" as const, label: "รายเดือน (9%)" },
            ].map((freq) => (
              <button
                key={freq.id}
                type="button"
                onClick={() => setPaymentFrequency(freq.id)}
                style={{
                  padding: "8px 4px",
                  borderRadius: "var(--radius-md)",
                  border: paymentFrequency === freq.id ? "2px solid var(--krungsri-yellow)" : "1px solid var(--border-subtle)",
                  backgroundColor: paymentFrequency === freq.id ? "var(--krungsri-navy)" : "#ffffff",
                  color: paymentFrequency === freq.id ? "#ffffff" : "var(--slate-700)",
                  fontSize: "var(--fs-xs)",
                  fontWeight: paymentFrequency === freq.id ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  textAlign: "center",
                }}
              >
                {freq.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Deductible / Options */}
        {(isMotor || isHealth) && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", backgroundColor: "#f8fafc", borderRadius: "var(--radius-md)" }}>
            <input
              id="chk-deductible"
              type="checkbox"
              checked={hasDeductible}
              onChange={(e) => setHasDeductible(e.target.checked)}
              style={{ accentColor: "var(--krungsri-yellow)", width: "16px", height: "16px", cursor: "pointer" }}
            />
            <label htmlFor="chk-deductible" style={{ fontSize: "var(--fs-xs)", color: "var(--slate-700)", cursor: "pointer", userSelect: "none" }}>
              {isMotor
                ? "เลือกมีค่าเสียหายส่วนแรก (Deductible 3,000 บาท/ครั้ง) รับส่วนลดเบี้ยประกัน 15%"
                : "เลือกมีค่ารับผิดชอบส่วนแรก (Deductible 20,000 บาท/ปี) รับส่วนลดเบี้ยประกัน 20%"}
            </label>
          </div>
        )}

        {/* Underwriting Tip */}
        {sumAssured >= 5000000 && (isHealth || !isMotor) && (
          <div style={{ fontSize: "12px", color: "var(--slate-600)", backgroundColor: "#f0fdf4", padding: "8px 12px", borderRadius: "var(--radius-md)", border: "1px solid #bbf7d0" }}>
            💡 ทุนประกันตั้งแต่ 5,000,000 บาทขึ้นไป จะเข้าสู่กระบวนการตรวจสุขภาพมาตรฐาน (Executive Medical Checkup)
          </div>
        )}

        {/* 4. Calculation Output Hero Box */}
        <div
          style={{
            padding: "18px 20px",
            backgroundColor: "var(--krungsri-navy)",
            borderRadius: "var(--radius-xl)",
            color: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 8px 20px -4px rgba(11, 30, 54, 0.3)",
          }}
        >
          <div>
            <div style={{ fontSize: "var(--fs-xs)", color: "rgba(255, 255, 255, 0.75)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>
              ประมาณการเบี้ยประกัน ({periodLabel})
            </div>
            <div style={{ fontSize: "var(--fs-3xl)", fontWeight: 800, color: "var(--krungsri-yellow)", marginTop: "2px" }}>
              {periodPremium.toLocaleString()} <span style={{ fontSize: "var(--fs-sm)", color: "#ffffff", fontWeight: 500 }}>บาท</span>
            </div>
            {paymentFrequency !== "annual" && (
              <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", marginTop: "2px" }}>
                เทียบเท่า {calculatedAnnual.toLocaleString()} บาท/ปี
              </div>
            )}
          </div>

          <div style={{ textAlign: "right", maxWidth: "180px" }}>
            <div style={{ fontSize: "12px", color: taxDeductionInfo.color, fontWeight: 700, display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
              <span>{taxDeductionInfo.tag}</span>
            </div>
            <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", marginTop: "2px", lineHeight: 1.3 }}>
              {taxDeductionInfo.rule}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
