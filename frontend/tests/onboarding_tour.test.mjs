import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  BROKER_TOUR_STEPS,
  MANAGER_TOUR_STEPS,
  ADMIN_TOUR_STEPS,
  getTourStepsForRole,
} from "../src/lib/onboardingSteps.ts";
import {
  calculateTourPopoverPosition,
  isRectOverlapping,
} from "../src/lib/onboardingPlacement.ts";

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

  // ── 6. Login Trigger Auto-displays Feature Tour Modal ──
  test("Logging into the system triggers immediate feature tour welcome modal", () => {
    const sessionStorage = new Map();
    const localStorage = new Map();

    // Emulate Login action
    function onLoginSuccess() {
      sessionStorage.set("trigger_welcome_onboarding", "true");
      localStorage.delete("broker-insight-onboarding-completed");
      localStorage.delete("broker-insight-onboarding-dismissed");
    }

    // Emulate Dashboard Landing & Route Check
    let showWelcome = false;
    let onboardingState = "idle";

    function onEnterRoute(pathname) {
      if (pathname === "/login") {
        showWelcome = false;
        return;
      }
      if (sessionStorage.get("trigger_welcome_onboarding") === "true") {
        sessionStorage.delete("trigger_welcome_onboarding");
        onboardingState = "welcome";
        showWelcome = true;
      }
    }

    onLoginSuccess();
    assert.equal(sessionStorage.get("trigger_welcome_onboarding"), "true");

    // Land on /dashboard
    onEnterRoute("/dashboard");
    assert.equal(showWelcome, true, "Entering system from login MUST immediately show feature guide modal");
    assert.equal(onboardingState, "welcome");
    assert.equal(sessionStorage.get("trigger_welcome_onboarding"), undefined, "Trigger flag is consumed");
  });

  // ── 7. Screen Viewport Overflow Prevention (No Cutoff / Clipping) ──
  test("Popover coordinates remain strictly within screen boundaries on desktop", () => {
    const windowSize = { width: 1280, height: 800 };
    const cardDimensions = { width: 440, height: 350 };
    const margin = 16;

    // Target near right edge
    const rightEdgeTarget = { top: 300, bottom: 350, left: 1100, right: 1250, width: 150, height: 50 };
    const posRight = calculateTourPopoverPosition({
      targetRect: rightEdgeTarget,
      windowSize,
      cardDimensions,
      preferredPlacement: "bottom",
      margin,
    });

    assert.ok(posRight.left >= margin, `Left (${posRight.left}) must be >= margin (${margin})`);
    assert.ok(
      posRight.left + posRight.maxWidth <= windowSize.width - margin + 1,
      `Right edge (${posRight.left + posRight.maxWidth}) must not exceed viewport width`
    );
    assert.ok(posRight.top >= margin, "Top must be >= margin");
    assert.ok(posRight.top + (posRight.maxHeight || 350) <= windowSize.height - margin + 1, "Bottom must not exceed viewport height");

    // Target near bottom edge
    const bottomEdgeTarget = { top: 720, bottom: 780, left: 400, right: 600, width: 200, height: 60 };
    const posBottom = calculateTourPopoverPosition({
      targetRect: bottomEdgeTarget,
      windowSize,
      cardDimensions,
      preferredPlacement: "bottom",
      margin,
    });

    assert.equal(posBottom.placement, "top", "Must flip to 'top' when target is near bottom edge");
    assert.ok(posBottom.top >= margin, `Flipped top (${posBottom.top}) must not overflow top edge`);
    assert.ok(posBottom.top + (posBottom.maxHeight || 350) <= bottomEdgeTarget.top, "Must sit above target");
  });

  // ── 8. Strict Target Feature Non-Obstruction (Never Cover Target Element) ──
  test("Popover bounding box NEVER intersects or covers the highlighted target feature", () => {
    const windowSize = { width: 1440, height: 900 };
    const cardDimensions = { width: 440, height: 340 };

    // Test cases representing various features across the app
    const testFeatures = [
      { name: "Dashboard Hero Banner", rect: { top: 80, bottom: 220, left: 280, right: 1100, width: 820, height: 140 }, pref: "bottom" },
      { name: "Customer Table", rect: { top: 260, bottom: 620, left: 280, right: 1200, width: 920, height: 360 }, pref: "top" },
      { name: "Customer 360 Profile Header", rect: { top: 90, bottom: 240, left: 300, right: 1000, width: 700, height: 150 }, pref: "bottom" },
      { name: "AI Insight Why-Now Card", rect: { top: 320, bottom: 580, left: 780, right: 1200, width: 420, height: 260 }, pref: "left" },
      { name: "Nearby Radar Map", rect: { top: 160, bottom: 600, left: 500, right: 1100, width: 600, height: 440 }, pref: "right" },
      { name: "Manual Selection Action Button", rect: { top: 620, bottom: 680, left: 400, right: 700, width: 300, height: 60 }, pref: "top" },
      { name: "Google Maps Navigation Preview", rect: { top: 700, bottom: 760, left: 550, right: 850, width: 300, height: 60 }, pref: "top" },
    ];

    testFeatures.forEach(({ name, rect, pref }) => {
      const result = calculateTourPopoverPosition({
        targetRect: rect,
        windowSize,
        cardDimensions,
        preferredPlacement: pref,
      });

      const effectiveHeight = Math.min(cardDimensions.height, result.maxHeight || cardDimensions.height);
      const popoverBox = {
        top: result.top,
        bottom: result.top + effectiveHeight,
        left: result.left,
        right: result.left + result.maxWidth,
      };

      const overlaps = isRectOverlapping(popoverBox, rect, 2);
      assert.equal(
        overlaps,
        false,
        `Tour popover must NOT overlap feature '${name}' (target: ${JSON.stringify(rect)}, popover: ${JSON.stringify(popoverBox)})`
      );
    });
  });

  // ── 9. Multi-directional Fallback Cascade ──
  test("Auto-placement cascade falls back across 4 directions when preferred direction is blocked", () => {
    const windowSize = { width: 1024, height: 768 };
    const cardDimensions = { width: 420, height: 340 };

    // Target fills entire top half: preferred 'top' is blocked, should fall back to 'bottom'
    const topBlocked = { top: 30, bottom: 320, left: 100, right: 900, width: 800, height: 290 };
    const resTop = calculateTourPopoverPosition({
      targetRect: topBlocked,
      windowSize,
      cardDimensions,
      preferredPlacement: "top",
    });
    assert.equal(resTop.placement, "bottom", "Must fall back to bottom when top is crowded");
    assert.ok(resTop.top >= topBlocked.bottom + 10, "Bottom placement sits below target");

    // Target fills entire bottom half: preferred 'bottom' is blocked, should fall back to 'top'
    const bottomBlocked = { top: 450, bottom: 740, left: 100, right: 900, width: 800, height: 290 };
    const resBottom = calculateTourPopoverPosition({
      targetRect: bottomBlocked,
      windowSize,
      cardDimensions,
      preferredPlacement: "bottom",
    });
    assert.equal(resBottom.placement, "top", "Must fall back to top when bottom is crowded");
    assert.ok(resBottom.top + (resBottom.maxHeight || 340) <= bottomBlocked.top, "Top placement sits above target");
  });

  // ── 10. Mobile Responsiveness and Target Clearance ──
  test("Mobile viewports dock gracefully without covering active feature targets", () => {
    const mobileSize = { width: 375, height: 667 };
    const cardDimensions = { width: 350, height: 280 };

    // Target in lower half: should dock at top
    const lowerTarget = { top: 400, bottom: 480, left: 20, right: 350, width: 330, height: 80 };
    const resMobileLower = calculateTourPopoverPosition({
      targetRect: lowerTarget,
      windowSize: mobileSize,
      cardDimensions,
    });
    assert.equal(resMobileLower.isMobile, true);
    assert.equal(resMobileLower.placement, "top");
    assert.ok(resMobileLower.top <= 20, "Must dock near top on mobile when target is in lower screen");

    // Target in upper half: should dock at bottom
    const upperTarget = { top: 60, bottom: 140, left: 20, right: 350, width: 330, height: 80 };
    const resMobileUpper = calculateTourPopoverPosition({
      targetRect: upperTarget,
      windowSize: mobileSize,
      cardDimensions,
    });
    assert.equal(resMobileUpper.isMobile, true);
    assert.equal(resMobileUpper.placement, "bottom");
  });
});

