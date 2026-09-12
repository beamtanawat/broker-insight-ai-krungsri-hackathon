"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  isNavigating: boolean;
  startTour: (roleOverride?: string, startIndex?: number) => void;
  jumpToStep: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  replayTour: (roleOverride?: string) => void;
  closeWelcome: () => void;
  showFeatureCatalog: boolean;
  openFeatureCatalog: () => void;
  closeFeatureCatalog: () => void;
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
  const [showFeatureCatalog, setShowFeatureCatalog] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if first-time user on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!stored) {
        // First time user: show welcome modal after brief delay for smooth mount
        const timer = setTimeout(() => {
          setShowWelcome(true);
        }, 500);
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

  // Update target element coordinates with smooth auto-scroll
  const locateAndMeasureTarget = useCallback((shouldScroll = false): boolean => {
    if (!currentStep || !currentStep.targetSelector) {
      setTargetRect(null);
      return false;
    }

    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      // Ensure element is actually rendered with dimensions
      if (rect.width > 0 && rect.height > 0) {
        if (shouldScroll) {
          // Check if partially out of viewport
          const isVisible =
            rect.top >= 80 &&
            rect.bottom <= window.innerHeight - 80 &&
            rect.left >= 40 &&
            rect.right <= window.innerWidth - 40;

          if (!isVisible) {
            el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
            // Re-measure after smooth scrolling starts settling
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

  // Manage target detection & polling on step or route change
  useEffect(() => {
    if (!isTourActive || !currentStep) {
      setTargetRect(null);
      return;
    }

    // Clear any previous polling loop
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // Immediate attempt with auto-scroll
    const found = locateAndMeasureTarget(true);

    if (!found) {
      // If not immediately found (e.g. page transition), poll for up to 2.5 seconds
      const startTime = Date.now();
      pollIntervalRef.current = setInterval(() => {
        const success = locateAndMeasureTarget(true);
        if (success || Date.now() - startTime > 2500) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setIsNavigating(false);
        }
      }, 80);
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

  const startTour = useCallback((override?: string, startIndex = 0) => {
    if (override) {
      setRoleOverride(override);
    }
    const tourSteps = getTourStepsForRole(override || userRole);
    setShowWelcome(false);
    setShowFeatureCatalog(false);
    const validIndex = Math.max(0, Math.min(startIndex, tourSteps.length - 1));
    setCurrentStepIndex(validIndex);
    setIsTourActive(true);

    const targetStep = tourSteps[validIndex];
    if (targetStep?.route && pathname !== targetStep.route) {
      setIsNavigating(true);
      router.push(targetStep.route);
    }
  }, [userRole, pathname, router]);

  const jumpToStep = useCallback((index: number) => {
    if (index < 0 || index >= steps.length) return;
    const targetStep = steps[index];
    setCurrentStepIndex(index);
    if (targetStep?.route && pathname !== targetStep.route) {
      setIsNavigating(true);
      router.push(targetStep.route);
    }
  }, [steps, pathname, router]);

  const nextStep = useCallback(() => {
    if (currentStepIndex + 1 < steps.length) {
      const nextIndex = currentStepIndex + 1;
      const nextStepObj = steps[nextIndex];
      setCurrentStepIndex(nextIndex);

      if (nextStepObj?.route && pathname !== nextStepObj.route) {
        setIsNavigating(true);
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
        setIsNavigating(true);
        router.push(prevStepObj.route);
      }
    }
  }, [currentStepIndex, steps, pathname, router]);

  const skipTour = useCallback(() => {
    setIsTourActive(false);
    setShowWelcome(false);
    setShowFeatureCatalog(false);
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
    startTour(roleOverride, 0);
  }, [startTour]);

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
        isTourActive,
        showWelcome,
        currentStepIndex,
        currentStep,
        steps,
        totalSteps: steps.length,
        targetRect: (!isTourActive || !currentStep) ? null : targetRect,
        isNavigating,
        startTour,
        jumpToStep,
        nextStep,
        prevStep,
        skipTour,
        replayTour,
        closeWelcome,
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
