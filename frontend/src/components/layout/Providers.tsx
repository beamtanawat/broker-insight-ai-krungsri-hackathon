"use client";
import React from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { OnboardingTourProvider } from "@/context/OnboardingTourContext";
import { OnboardingWelcomeModal } from "@/components/onboarding/OnboardingWelcomeModal";
import { GuidedTourSpotlight } from "@/components/onboarding/GuidedTourSpotlight";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <OnboardingTourProvider>
        {children}
        <OnboardingWelcomeModal />
        <GuidedTourSpotlight />
      </OnboardingTourProvider>
    </ToastProvider>
  );
}
