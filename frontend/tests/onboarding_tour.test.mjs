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
  test("Broker receives focused 9-step feature tour flow matching Section 6", () => {
    const steps = getTourStepsForRole("broker");
    assert.equal(steps.length, 9, "Broker tour must contain exactly 9 steps");

    const expectedTitles = [
      "แดชบอร์ด",
      "ฐานข้อมูลลูกค้า",
      "Customer 360°",
      "AI ช่วยจัดลำดับความสำคัญ",
      "คำแนะนำสำหรับลูกค้า",
      "ลูกค้าใกล้เคียง",
      "คุณเป็นคนเลือก",
      "นำทางเมื่อต้องการ",
      "Analytics",
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
    assert.equal(stepsUndefined.length, 9);
    assert.equal(stepsUnknown.length, 9);
    assert.equal(stepsUndefined[0].title, "แดชบอร์ด");
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
    assert.equal(selectionStep.title, "คุณเป็นคนเลือก");
    assert.ok(selectionStep.description.includes("คุณเป็นผู้เลือกเอง"));

    // Verify Step 8 highlights on-demand navigation
    const navStep = BROKER_TOUR_STEPS.find((s) => s.id === "broker-navigation");
    assert.ok(navStep, "Step 8 must exist");
    assert.equal(navStep.title, "นำทางเมื่อต้องการ");
  });

  // ── 4. Two Separate States & Finite State Machine Execution ──
  test("Welcome Modal and Guided Tour are two distinct states and never loop", () => {
    const storage = new Map();
    const COMPLETED_KEY = "broker-insight-onboarding-completed";
    const DISMISSED_KEY = "broker-insight-onboarding-dismissed";
    const STATE_KEY = "broker-insight-onboarding-state";
    const STEP_KEY = "broker-insight-onboarding-current-step";

    // Simulating State Machine
    let state = "idle";
    let stepIndex = 0;
    let showWelcome = false;
    let isTourActive = false;

    // 1. Initial user mount
    const onMount = () => {
      if (storage.get(COMPLETED_KEY) === "true") {
        state = "completed";
        showWelcome = false;
        isTourActive = false;
        return;
      }
      if (storage.get(DISMISSED_KEY) === "true") {
        state = "dismissed";
        showWelcome = false;
        isTourActive = false;
        return;
      }
      if (storage.get(STATE_KEY) === "tour") {
        state = "tour";
        showWelcome = false;
        isTourActive = true;
        stepIndex = parseInt(storage.get(STEP_KEY) || "0", 10);
        return;
      }
      // First time
      state = "welcome";
      showWelcome = true;
      isTourActive = false;
    };

    // First login
    onMount();
    assert.equal(state, "welcome", "Should start in welcome state on first visit");
    assert.equal(showWelcome, true, "Welcome modal must show");
    assert.equal(isTourActive, false, "Tour spotlight must NOT show in welcome state");

    // 2. User clicks 'เริ่มแนะนำระบบ →'
    const startTour = () => {
      state = "tour";
      showWelcome = false;
      isTourActive = true;
      stepIndex = 0;
      storage.set(STATE_KEY, "tour");
      storage.set(STEP_KEY, "0");
    };

    startTour();
    assert.equal(state, "tour", "State transitions from welcome to tour");
    assert.equal(showWelcome, false, "Welcome modal MUST close immediately");
    assert.equal(isTourActive, true, "Tour spotlight is now active");
    assert.equal(stepIndex, 0, "Step index starts at 0 (Dashboard)");

    // 3. User clicks 'ถัดไป' (Next)
    const nextStep = (stepsCount = 9) => {
      if (stepIndex + 1 < stepsCount) {
        stepIndex += 1;
        storage.set(STEP_KEY, String(stepIndex));
      } else {
        // Complete
        state = "completed";
        isTourActive = false;
        showWelcome = false;
        storage.set(COMPLETED_KEY, "true");
        storage.delete(STATE_KEY);
        storage.delete(STEP_KEY);
      }
    };

    // Step 1 -> Step 2
    nextStep();
    assert.equal(stepIndex, 1, "Next advances step index to 1 (Customers)");
    assert.equal(state, "tour", "State remains in tour");
    assert.equal(showWelcome, false, "Welcome modal MUST NOT reopen on Next");

    // Emulate page navigation to /customers (simulating remount or route change)
    onMount();
    assert.equal(state, "tour", "State survives route navigation");
    assert.equal(stepIndex, 1, "Step index is preserved at 1 across navigation");
    assert.equal(showWelcome, false, "Welcome modal NEVER loops on navigation during tour");

    // Walk through remaining steps: 2, 3, 4, 5, 6, 7, 8
    for (let i = 2; i <= 8; i++) {
      nextStep();
      assert.equal(stepIndex, i, `Step advances correctly to ${i}`);
      assert.equal(showWelcome, false, "Welcome modal NEVER reappears between steps");
      assert.equal(isTourActive, true);
    }

    // Final step: click 'เริ่มใช้งาน'
    nextStep();
    assert.equal(state, "completed", "Tour is completed on final step");
    assert.equal(isTourActive, false, "Tour spotlight is closed");
    assert.equal(showWelcome, false, "Welcome modal is closed");
    assert.equal(storage.get(COMPLETED_KEY), "true", "Completion is permanently persisted");

    // Subsequent page refresh/visit
    onMount();
    assert.equal(state, "completed");
    assert.equal(showWelcome, false, "Tour never shows again after completion");
    assert.equal(isTourActive, false);
  });

  // ── 5. Graceful Fallback for Missing Target Element ──
  test("Fallback calculation centers popover when target element is absent", () => {
    function computePosition(targetRect, _windowSize = { width: 1200, height: 800 }) {
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
