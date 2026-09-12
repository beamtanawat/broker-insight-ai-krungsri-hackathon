"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@/types";
import { TourStep, getTourStepsForRole } from "@/lib/onboardingSteps";

const ONBOARDING_STORAGE_KEY = "broker_insight_onboarding_completed_v1";

interface OnboardingTourContextType {
  isTourActive: boolean;
  showWelcome: boolean;
  currentStepIndex: number;
  currentStep: TourStep | null;
  steps: TourStep[];
  totalSteps: number;
  targetRect: DOMRect | null;
  startTour: (roleOverride?: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  replayTour: (roleOverride?: string) => void;
  closeWelcome: () => void;
}

const OnboardingTourContext = createContext<OnboardingTourContextType | null>(null);

interface OnboardingTourProviderProps {
  user: User | null;
  children: React.ReactNode;
}

export function OnboardingTourProvider({ user, children }: OnboardingTourProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const userRole = user?.role || "broker";
  const [roleOverride, setRoleOverride] = useState<string | null>(null);
  const steps = useMemo(() => getTourStepsForRole(roleOverride || userRole), [roleOverride, userRole]);

  const [isTourActive, setIsTourActive] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Check if first-time user on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!stored) {
        // First time user: show welcome modal after brief delay for smooth mount
        const timer = setTimeout(() => {
          setShowWelcome(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // LocalStorage access failsafe (e.g. private mode)
    }
  }, []);

  const currentStep = useMemo(() => {
    if (!isTourActive || currentStepIndex < 0 || currentStepIndex >= steps.length) {
      return null;
    }
    return steps[currentStepIndex];
  }, [isTourActive, currentStepIndex, steps]);

  // Update target element coordinates whenever step, pathname, or scroll/resize happens
  const updateTargetRect = useCallback(() => {
    if (!currentStep || !currentStep.targetSelector) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      // Ensure element has dimension
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect(rect);
        return;
      }
    }
    setTargetRect(null);
  }, [currentStep]);

  useEffect(() => {
    if (!isTourActive || !currentStep) {
      return;
    }

    const initialTimer = setTimeout(updateTargetRect, 0);

    // Retry a few times in case route transitions or animations are completing
    const retryTimers = [
      setTimeout(updateTargetRect, 100),
      setTimeout(updateTargetRect, 300),
      setTimeout(updateTargetRect, 600),
    ];

    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);

    return () => {
      clearTimeout(initialTimer);
      retryTimers.forEach(clearTimeout);
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [isTourActive, currentStep, pathname, updateTargetRect]);

  const startTour = useCallback((override?: string) => {
    if (override) {
      setRoleOverride(override);
    }
    const tourSteps = getTourStepsForRole(override || userRole);
    setShowWelcome(false);
    setCurrentStepIndex(0);
    setIsTourActive(true);

    const firstStep = tourSteps[0];
    if (firstStep?.route && pathname !== firstStep.route) {
      router.push(firstStep.route);
    }
  }, [userRole, pathname, router]);

  const nextStep = useCallback(() => {
    if (currentStepIndex + 1 < steps.length) {
      const nextIndex = currentStepIndex + 1;
      const nextStepObj = steps[nextIndex];
      setCurrentStepIndex(nextIndex);

      if (nextStepObj?.route && pathname !== nextStepObj.route) {
        router.push(nextStepObj.route);
      }
    } else {
      // Completed tour!
      setIsTourActive(false);
      try {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, "completed");
      } catch {}
    }
  }, [currentStepIndex, steps, pathname, router]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      const prevStepObj = steps[prevIndex];
      setCurrentStepIndex(prevIndex);

      if (prevStepObj?.route && pathname !== prevStepObj.route) {
        router.push(prevStepObj.route);
      }
    }
  }, [currentStepIndex, steps, pathname, router]);

  const skipTour = useCallback(() => {
    setIsTourActive(false);
    setShowWelcome(false);
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "dismissed");
    } catch {}
  }, []);

  const closeWelcome = useCallback(() => {
    setShowWelcome(false);
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "dismissed");
    } catch {}
  }, []);

  const replayTour = useCallback((roleOverride?: string) => {
    startTour(roleOverride);
  }, [startTour]);

  return (
    <OnboardingTourContext.Provider
      value={{
        isTourActive,
        showWelcome,
        currentStepIndex,
        currentStep,
        steps,
        totalSteps: steps.length,
        targetRect: (!isTourActive || !currentStep) ? null : targetRect,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        replayTour,
        closeWelcome,
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
