"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@/types";
import { TourStep, getTourStepsForRole } from "@/lib/onboardingSteps";

export const ONBOARDING_COMPLETED_KEY = "broker-insight-onboarding-completed";
export const ONBOARDING_DISMISSED_KEY = "broker-insight-onboarding-dismissed";
export const ONBOARDING_STATE_KEY = "broker-insight-onboarding-state";
export const ONBOARDING_STEP_KEY = "broker-insight-onboarding-current-step";
export const LEGACY_STORAGE_KEY = "broker_insight_onboarding_completed_v1";

export type OnboardingState = "idle" | "welcome" | "tour" | "completed" | "dismissed";

interface OnboardingTourContextType {
  onboardingState: OnboardingState;
  isTourActive: boolean;
  showWelcome: boolean;
  currentStepIndex: number;
  currentStep: TourStep | null;
  steps: TourStep[];
  totalSteps: number;
  targetRect: DOMRect | null;
  isNavigating: boolean;
  userRole: string;
  setUserRole: (role: string) => void;
  startTour: (roleOverride?: string, startIndex?: number) => void;
  jumpToStep: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  replayTour: (roleOverride?: string) => void;
  closeWelcome: () => void;
  openWelcomeModal: () => void;
  showFeatureCatalog: boolean;
  openFeatureCatalog: () => void;
  closeFeatureCatalog: () => void;
}

const OnboardingTourContext = createContext<OnboardingTourContextType | null>(null);

interface OnboardingTourProviderProps {
  user?: User | null;
  children: React.ReactNode;
}

export function OnboardingTourProvider({ user, children }: OnboardingTourProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [userRole, setUserRole] = useState<string>(user?.role || "broker");
  const [roleOverride, setRoleOverride] = useState<string | null>(null);

  // Sync role if user changes
  useEffect(() => {
    if (user?.role) {
      setUserRole(user.role);
    }
  }, [user?.role]);

  const activeRole = roleOverride || userRole;
  const steps = useMemo(() => getTourStepsForRole(activeRole), [activeRole]);

  const [onboardingState, setOnboardingState] = useState<OnboardingState>("idle");
  const [isTourActive, setIsTourActive] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showFeatureCatalog, setShowFeatureCatalog] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef(false);

  // Check state & persistence on client mount
  useEffect(() => {
    if (typeof window === "undefined" || hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    try {
      const isCompleted =
        localStorage.getItem(ONBOARDING_COMPLETED_KEY) === "true" ||
        localStorage.getItem(LEGACY_STORAGE_KEY) === "completed";
      const isDismissed =
        localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "true" ||
        localStorage.getItem(LEGACY_STORAGE_KEY) === "dismissed";

      if (isCompleted) {
        setOnboardingState("completed");
        setShowWelcome(false);
        setIsTourActive(false);
        return;
      }

      if (isDismissed) {
        setOnboardingState("dismissed");
        setShowWelcome(false);
        setIsTourActive(false);
        return;
      }

      const savedState = localStorage.getItem(ONBOARDING_STATE_KEY);
      const savedStep = parseInt(localStorage.getItem(ONBOARDING_STEP_KEY) || "0", 10);

      if (savedState === "tour") {
        setOnboardingState("tour");
        setIsTourActive(true);
        setShowWelcome(false);
        const validStep = isNaN(savedStep) ? 0 : Math.max(0, Math.min(savedStep, steps.length - 1));
        setCurrentStepIndex(validStep);
        return;
      }

      // First time user: show welcome modal after brief delay
      setOnboardingState("welcome");
      const timer = setTimeout(() => {
        setShowWelcome(true);
      }, 400);
      return () => clearTimeout(timer);
    } catch {
      // LocalStorage access failsafe
    }
  }, [steps.length]);

  const currentStep = useMemo(() => {
    if (!isTourActive || currentStepIndex < 0 || currentStepIndex >= steps.length) {
      return null;
    }
    return steps[currentStepIndex];
  }, [isTourActive, currentStepIndex, steps]);

  // Update target element coordinates with smooth auto-scroll
  const locateAndMeasureTarget = useCallback((shouldScroll = false): boolean => {
    if (!currentStep || !currentStep.targetSelector) {
      setTargetRect(null);
      return false;
    }

    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        if (shouldScroll) {
          const isVisible =
            rect.top >= 80 &&
            rect.bottom <= window.innerHeight - 80 &&
            rect.left >= 40 &&
            rect.right <= window.innerWidth - 40;

          if (!isVisible) {
            el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
            setTimeout(() => {
              const updatedRect = el.getBoundingClientRect();
              setTargetRect(updatedRect);
            }, 300);
          }
        }
        setTargetRect(rect);
        setIsNavigating(false);
        return true;
      }
    }
    return false;
  }, [currentStep]);

  // Target detection & polling on step or route change
  useEffect(() => {
    if (!isTourActive || !currentStep) {
      setTargetRect(null);
      return;
    }

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    const found = locateAndMeasureTarget(true);

    if (!found) {
      const startTime = Date.now();
      pollIntervalRef.current = setInterval(() => {
        const success = locateAndMeasureTarget(true);
        if (success || Date.now() - startTime > 3000) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setIsNavigating(false);
        }
      }, 70);
    }

    function handleScrollOrResize() {
      locateAndMeasureTarget(false);
    }

    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, true);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [isTourActive, currentStep, pathname, locateAndMeasureTarget]);

  // Start Tour
  const startTour = useCallback((override?: string, startIndex = 0) => {
    if (override) {
      setRoleOverride(override);
    }
    const roleForSteps = override || activeRole;
    const tourSteps = getTourStepsForRole(roleForSteps);

    // Explicit state transition: welcome -> tour
    setOnboardingState("tour");
    setShowWelcome(false);
    setShowFeatureCatalog(false);
    setIsTourActive(true);

    const validIndex = Math.max(0, Math.min(startIndex, tourSteps.length - 1));
    setCurrentStepIndex(validIndex);

    try {
      localStorage.setItem(ONBOARDING_STATE_KEY, "tour");
      localStorage.setItem(ONBOARDING_STEP_KEY, String(validIndex));
    } catch {}

    const targetStep = tourSteps[validIndex];
    if (targetStep?.route && pathname !== targetStep.route) {
      setIsNavigating(true);
      router.push(targetStep.route);
    }
  }, [activeRole, pathname, router]);

  // Jump to Step
  const jumpToStep = useCallback((index: number) => {
    if (index < 0 || index >= steps.length) return;
    const targetStep = steps[index];
    setCurrentStepIndex(index);

    try {
      localStorage.setItem(ONBOARDING_STEP_KEY, String(index));
    } catch {}

    if (targetStep?.route && pathname !== targetStep.route) {
      setIsNavigating(true);
      router.push(targetStep.route);
    }
  }, [steps, pathname, router]);

  // Complete Tour
  const completeTour = useCallback(() => {
    setOnboardingState("completed");
    setIsTourActive(false);
    setShowWelcome(false);
    setShowFeatureCatalog(false);
    setTargetRect(null);

    try {
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
      localStorage.setItem(LEGACY_STORAGE_KEY, "completed");
      localStorage.removeItem(ONBOARDING_STATE_KEY);
      localStorage.removeItem(ONBOARDING_STEP_KEY);
    } catch {}
  }, []);

  // Next Step
  const nextStep = useCallback(() => {
    if (currentStepIndex + 1 < steps.length) {
      const nextIndex = currentStepIndex + 1;
      const nextStepObj = steps[nextIndex];
      setCurrentStepIndex(nextIndex);

      try {
        localStorage.setItem(ONBOARDING_STEP_KEY, String(nextIndex));
      } catch {}

      if (nextStepObj?.route && pathname !== nextStepObj.route) {
        setIsNavigating(true);
        router.push(nextStepObj.route);
      }
    } else {
      completeTour();
    }
  }, [currentStepIndex, steps, pathname, router, completeTour]);

  // Prev Step
  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      const prevStepObj = steps[prevIndex];
      setCurrentStepIndex(prevIndex);

      try {
        localStorage.setItem(ONBOARDING_STEP_KEY, String(prevIndex));
      } catch {}

      if (prevStepObj?.route && pathname !== prevStepObj.route) {
        setIsNavigating(true);
        router.push(prevStepObj.route);
      }
    }
  }, [currentStepIndex, steps, pathname, router]);

  // Skip Tour
  const skipTour = useCallback(() => {
    setOnboardingState("dismissed");
    setIsTourActive(false);
    setShowWelcome(false);
    setShowFeatureCatalog(false);
    setTargetRect(null);

    try {
      localStorage.setItem(ONBOARDING_DISMISSED_KEY, "true");
      localStorage.setItem(LEGACY_STORAGE_KEY, "dismissed");
      localStorage.removeItem(ONBOARDING_STATE_KEY);
      localStorage.removeItem(ONBOARDING_STEP_KEY);
    } catch {}
  }, []);

  const closeWelcome = useCallback(() => {
    skipTour();
  }, [skipTour]);

  const replayTour = useCallback((roleOverride?: string) => {
    startTour(roleOverride, 0);
  }, [startTour]);

  const openWelcomeModal = useCallback(() => {
    setOnboardingState("welcome");
    setShowWelcome(true);
    setIsTourActive(false);
    setShowFeatureCatalog(false);
  }, []);

  const openFeatureCatalog = useCallback(() => {
    setShowWelcome(false);
    setIsTourActive(false);
    setShowFeatureCatalog(true);
  }, []);

  const closeFeatureCatalog = useCallback(() => {
    setShowFeatureCatalog(false);
  }, []);

  return (
    <OnboardingTourContext.Provider
      value={{
        onboardingState,
        isTourActive,
        showWelcome,
        currentStepIndex,
        currentStep,
        steps,
        totalSteps: steps.length,
        targetRect: (!isTourActive || !currentStep) ? null : targetRect,
        isNavigating,
        userRole,
        setUserRole,
        startTour,
        jumpToStep,
        nextStep,
        prevStep,
        skipTour,
        completeTour,
        replayTour,
        closeWelcome,
        openWelcomeModal,
        showFeatureCatalog,
        openFeatureCatalog,
        closeFeatureCatalog,
      }}
    >
      {children}
    </OnboardingTourContext.Provider>
  );
}

export function useOnboardingTour() {
  const ctx = useContext(OnboardingTourContext);
  if (!ctx) {
    throw new Error("useOnboardingTour must be used within an OnboardingTourProvider");
  }
  return ctx;
}
