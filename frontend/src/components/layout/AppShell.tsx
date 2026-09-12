"use client";
import React, { useState, useEffect } from "react";
import type { User } from "@/types";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

import { OnboardingTourProvider } from "@/context/OnboardingTourContext";
import { OnboardingWelcomeModal } from "../onboarding/OnboardingWelcomeModal";
import { GuidedTourSpotlight } from "../onboarding/GuidedTourSpotlight";

interface AppShellProps {
  user: User | null;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/** Desktop breakpoint for persistent sidebar */
const DESKTOP_BREAKPOINT = 1024;

export function AppShell({
  user,
  title,
  subtitle,
  actions,
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed]         = useState(false);
  const [mobileOpen, setMobileOpen]       = useState(false);
  const [isMobile, setIsMobile]           = useState(false);

  useEffect(() => {
    function checkWidth() {
      setIsMobile(window.innerWidth < DESKTOP_BREAKPOINT);
      if (window.innerWidth >= DESKTOP_BREAKPOINT) setMobileOpen(false);
    }
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [title]);

  return (
    <OnboardingTourProvider user={user}>
      <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-app)" }}>

        {/* ── Desktop persistent sidebar ── */}
        {!isMobile && (
          <Sidebar
            user={user}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
          />
        )}

        {/* ── Mobile: overlay sidebar ── */}
        {isMobile && mobileOpen && (
          <>
            {/* Backdrop */}
            <div
              aria-hidden="true"
              onClick={() => setMobileOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(15, 23, 42, 0.5)",
                zIndex: 100,
                animation: "fadeIn var(--motion-fast) ease",
              }}
            />
            {/* Sidebar drawer */}
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                bottom: 0,
                zIndex: 101,
                animation: "slideInRight var(--motion-base) ease",
                // Slide in from left on mobile
                transform: "translateX(0)",
              }}
            >
              <Sidebar
                user={user}
                collapsed={false}
                onMobileClose={() => setMobileOpen(false)}
              />
            </div>
          </>
        )}

        {/* ── Main Content Area ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <Topbar
            user={user}
            title={title}
            subtitle={subtitle}
            actions={actions}
            onMobileMenuToggle={isMobile ? () => setMobileOpen(!mobileOpen) : undefined}
          />
          <main
            id="main-content"
            tabIndex={-1}
            style={{ flex: 1, padding: "var(--space-6) 28px" }}
          >
            {children}
          </main>
        </div>
      </div>

      {/* ── Onboarding & Guided Tour Modals ── */}
      <OnboardingWelcomeModal />
      <GuidedTourSpotlight />
    </OnboardingTourProvider>
  );
}
