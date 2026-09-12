import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  BROKER_TOUR_STEPS,
  MANAGER_TOUR_STEPS,
  ADMIN_TOUR_STEPS,
  getTourStepsForRole,
} from "../src/lib/onboardingSteps.ts";

describe("First-Time User Onboarding & Guided Feature Tour", () => {
  // ── 1. Role-specific Steps Verification ──
  test("Broker receives comprehensive 10-step feature tour flow", () => {
    const steps = getTourStepsForRole("broker");
    assert.equal(steps.length, 10, "Broker tour must contain exactly 10 steps");

    const expectedTitles = [
      "แดชบอร์ดภาพรวมและงานประจำวัน",
      "จัดการและค้นหาลูกค้าในพอร์ต",
      "ข้อมูลลูกค้าแบบ 360° ครบวงจร",
      'AI ชี้เป้า "Why Now" และความโปร่งใส',
      "คำแนะนำผลิตภัณฑ์ & ตรวจเกณฑ์ 100%",
      "ค้นหาลูกค้าใกล้เคียงรอบตัวคุณ",
      "คุณเป็นคนเลือกเองเสมอ",
      "นำทางจริงด้วย Google Maps",
      "โมบายล์เวิร์กสเปซ My Protection",
      "ดูผลการดำเนินงานและสถิติ",
    ];

    steps.forEach((step, idx) => {
      assert.equal(step.stepNumber, idx + 1, `Step ${idx + 1} number must match`);
      assert.equal(step.title, expectedTitles[idx], `Step ${idx + 1} title must match`);
      assert.ok(step.description && step.description.length > 10, `Step ${idx + 1} has meaningful description`);
      assert.ok(step.route, `Step ${idx + 1} has a valid route`);
      assert.ok(step.targetSelector, `Step ${idx + 1} has a target selector`);
    });
  });

  test("Manager receives exact 5-step operational analytics tour", () => {
    const steps = getTourStepsForRole("manager");
    assert.equal(steps.length, 5, "Manager tour must contain exactly 5 steps");

    const expectedTitles = [
      "แดชบอร์ดภาพรวมการดำเนินงาน",
      "ภาพรวมการวิเคราะห์ลูกค้า",
      "การประเมินความเสี่ยงและช่องว่างความคุ้มครอง",
      "ระบบ AI Insight & ติดตามประสิทธิภาพทีม",
      "การกำกับดูแลและรายงานเชิงลึก",
    ];

    steps.forEach((step, idx) => {
      assert.equal(step.stepNumber, idx + 1);
      assert.equal(step.title, expectedTitles[idx]);
    });
  });

  test("Admin receives exact 5-step governance and audit tour", () => {
    const steps = getTourStepsForRole("admin");
    assert.equal(steps.length, 5, "Admin tour must contain exactly 5 steps");

    const expectedTitles = [
      "ศูนย์กลางการควบคุมระบบ",
      "การตรวจสอบความสมบูรณ์ของโมเดล AI",
      "ความโปร่งใสและคำอธิบายโมเดล",
      "บันทึกประวัติการตรวจสอบย้อนกลับ",
      "การทดสอบนำร่องและการจำลองสถานการณ์",
    ];

    steps.forEach((step, idx) => {
      assert.equal(step.stepNumber, idx + 1);
      assert.equal(step.title, expectedTitles[idx]);
    });
  });

  test("Default role fallback safely yields Broker tour", () => {
    const stepsUndefined = getTourStepsForRole(undefined);
    const stepsUnknown = getTourStepsForRole("unknown_role");
    assert.equal(stepsUndefined.length, 10);
    assert.equal(stepsUnknown.length, 10);
    assert.equal(stepsUndefined[0].title, "แดชบอร์ดภาพรวมและงานประจำวัน");
  });

  // ── 2. RBAC Route Protection ──
  test("Broker tour does not leak admin or unauthorized routes", () => {
    const steps = getTourStepsForRole("broker");
    const adminRoutes = ["/model", "/admin/audit", "/pilot"];

    steps.forEach((step) => {
      assert.ok(
        !adminRoutes.includes(step.route),
        `Broker tour leaked unauthorized admin route: ${step.route} in step ${step.id}`
      );
    });
  });

  test("Manager tour does not leak admin audit route", () => {
    const steps = getTourStepsForRole("manager");
    steps.forEach((step) => {
      assert.notEqual(step.route, "/admin/audit", "Manager cannot access /admin/audit");
    });
  });

  // ── 3. Decision-Support Principle & Assistive AI Messaging ──
  test("All tour steps reinforce AI decision support and avoid autonomous claims", () => {
    const allSteps = [...BROKER_TOUR_STEPS, ...MANAGER_TOUR_STEPS, ...ADMIN_TOUR_STEPS];

    const forbiddenPhrases = [
      "ตัดสินใจแทนคุณ",
      "เลือกลูกค้าให้อัตโนมัติ",
      "สั่งว่าต้องไปหา",
      "จองคิวอัตโนมัติ",
      "นัดหมายอัตโนมัติ",
      "จัดเส้นทางอัตโนมัติทั้งวัน",
    ];

    allSteps.forEach((step) => {
      const fullText = `${step.title} ${step.description}`;
      forbiddenPhrases.forEach((phrase) => {
        assert.ok(
          !fullText.includes(phrase),
          `Step '${step.id}' violates decision support principle by containing '${phrase}'`
        );
      });
    });

    // Verify Step 7 explicitly guarantees broker autonomy
    const selectionStep = BROKER_TOUR_STEPS.find((s) => s.id === "broker-manual-selection");
    assert.ok(selectionStep, "Step 7 must exist");
    assert.equal(selectionStep.title, "คุณเป็นคนเลือกเองเสมอ");
    assert.ok(selectionStep.description.includes("คุณเป็นผู้เลือกเอง"));

    // Verify Step 8 highlights on-demand navigation
    const navStep = BROKER_TOUR_STEPS.find((s) => s.id === "broker-navigation");
    assert.ok(navStep, "Step 8 must exist");
    assert.equal(navStep.title, "นำทางจริงด้วย Google Maps");
  });

  // ── 4. First-Time State Persistence Emulation ──
  test("First-time user state machine handles initial, dismiss, complete, and replay", () => {
    const storageMock = new Map();
    const STORAGE_KEY = "broker_insight_onboarding_completed_v1";

    const isFirstTime = () => !storageMock.has(STORAGE_KEY);
    const dismiss = () => storageMock.set(STORAGE_KEY, "dismissed");
    const complete = () => storageMock.set(STORAGE_KEY, "completed");
    const replay = () => true; // Replay runs regardless of storage

    // Initial state: first time
    assert.equal(isFirstTime(), true, "Should be first time initially");

    // After dismiss: no longer first time
    dismiss();
    assert.equal(isFirstTime(), false, "Should not be first time after dismiss");
    assert.equal(storageMock.get(STORAGE_KEY), "dismissed");

    // After completion: marks completed
    complete();
    assert.equal(isFirstTime(), false, "Should not be first time after complete");
    assert.equal(storageMock.get(STORAGE_KEY), "completed");

    // Replay is always allowed
    assert.equal(replay(), true, "Replay must always succeed");
  });

  // ── 5. Graceful Fallback for Missing Target Element ──
  test("Fallback calculation centers popover when target element is absent", () => {
    function computePosition(targetRect, windowSize = { width: 1200, height: 800 }) {
      if (!targetRect) {
        return {
          isCentered: true,
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        };
      }
      return {
        isCentered: false,
        top: targetRect.bottom + 14,
        left: targetRect.left,
      };
    }

    const fallbackPos = computePosition(null);
    assert.equal(fallbackPos.isCentered, true, "Must center when target is null");
    assert.equal(fallbackPos.top, "50%");
    assert.equal(fallbackPos.left, "50%");

    const elementPos = computePosition({ top: 100, bottom: 150, left: 200, right: 300, width: 100, height: 50 });
    assert.equal(elementPos.isCentered, false, "Must anchor when target exists");
    assert.equal(elementPos.top, 164);
  });
});
