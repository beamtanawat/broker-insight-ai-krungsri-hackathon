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
  const [sumAssured, setSumAssured] = useState<number>(1000000); // 1,000,000 THB default
  const [paymentFrequency, setPaymentFrequency] = useState<"annual" | "semi" | "quarter" | "monthly">("annual");
  const [hasDeductible, setHasDeductible] = useState<boolean>(false);

  if (!product) return null;

  // Derive estimated rate per 1M THB sum assured based on category / estimated_premium_annual
  const categoryRates: Record<string, number> = {
    health: 24000,
    life: 18000,
    pension: 42000,
    savings: 35000,
    credit: 15000,
  };
  const catKey = (product.category || "").toLowerCase();
  const fallbackRate = Object.entries(categoryRates).find(([k]) => catKey.includes(k))?.[1] || 22000;
  const ratePerMillion = product.estimated_premium_annual || fallbackRate;

  // Compute raw annual premium
  let calculatedAnnual = Math.round((sumAssured / 1000000) * ratePerMillion);
  if (hasDeductible) {
    calculatedAnnual = Math.round(calculatedAnnual * 0.85); // 15% discount for deductible
  }

  // Compute period premium
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
            * เป็นการประมาณการเบื้องต้น เบี้ยประกันจริงขึ้นอยู่กับผลการพิจารณารับประกัน
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
            <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", color: "var(--krungsri-navy)" }}>
              {product.product_name}
            </div>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "2px" }}>
              หมวดหมู่: <strong>{product.category || "ประกันชีวิตและสุขภาพ"}</strong> · รหัส: {product.product_id}
            </div>
          </div>
          <Badge variant="gold" size="sm">
            AI Match: {Math.round((product.match_score || 0.9) * 100)}%
          </Badge>
        </div>

        {/* 1. Sum Assured Slider */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
            <label htmlFor={sumAssuredId} style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--slate-700)" }}>
              ทุนประกันภัย / ความคุ้มครอง (Sum Assured):
            </label>
            <div style={{ fontSize: "var(--fs-lg)", fontWeight: 800, color: "var(--krungsri-navy)" }}>
              {sumAssured.toLocaleString()} <span style={{ fontSize: "var(--fs-xs)", fontWeight: 500, color: "var(--slate-500)" }}>บาท</span>
            </div>
          </div>
          <input
            id={sumAssuredId}
            type="range"
            min={200000}
            max={10000000}
            step={100000}
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
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--slate-400)", marginTop: "4px" }}>
            <span>200,000 บาท</span>
            <span>5,000,000 บาท</span>
            <span>10,000,000 บาท</span>
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
              { id: "semi" as const, label: "ราย 6 เดือน" },
              { id: "quarter" as const, label: "ราย 3 เดือน" },
              { id: "monthly" as const, label: "รายเดือน" },
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
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", backgroundColor: "#f8fafc", borderRadius: "var(--radius-md)" }}>
          <input
            id="chk-deductible"
            type="checkbox"
            checked={hasDeductible}
            onChange={(e) => setHasDeductible(e.target.checked)}
            style={{ accentColor: "var(--krungsri-yellow)", width: "16px", height: "16px", cursor: "pointer" }}
          />
          <label htmlFor="chk-deductible" style={{ fontSize: "var(--fs-xs)", color: "var(--slate-700)", cursor: "pointer", userSelect: "none" }}>
            มีค่าเสียหายส่วนแรก (Deductible 20,000 บาท) เพื่อรับส่วนลดเบี้ยประกัน 15%
          </label>
        </div>

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
              <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.6)", marginTop: "2px" }}>
                เทียบเท่า {calculatedAnnual.toLocaleString()} บาท/ปี
              </div>
            )}
          </div>

          <div style={{ textAlign: "right", maxWidth: "160px" }}>
            <div style={{ fontSize: "11px", color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
              <span>✓ ลดหย่อนภาษีได้</span>
            </div>
            <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.7)", marginTop: "2px", lineHeight: 1.3 }}>
              สูงสุด 100,000 บาท ตามเกณฑ์กรมสรรพากร
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
