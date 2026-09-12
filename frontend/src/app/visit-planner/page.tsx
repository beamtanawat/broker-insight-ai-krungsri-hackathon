"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { clearTokens, isAuthenticated } from "@/lib/auth";
import type {
  User,
  CandidateCustomerOut,
  LocationPoint,
} from "@/types";
import { AppShell } from "@/components/layout";
import {
  NearbyFilterBar,
  NearbyMetricsRow,
  NearbyCustomerList,
  NearbyMapVisualizer,
  CustomerDecisionPanel,
} from "@/components/visit-planner";
import {
  DEFAULT_BROKER_LOCATION,
  SHOWCASE_KPI_STATS,
  SHOWCASE_NEARBY_CUSTOMERS,
} from "@/lib/nearbyMockData";

export default function VisitPlannerPage() {
  const router = useRouter();

  // Core Authentication & Config State
  const [user, setUser] = useState<User | null>(null);

  // Broker Current Location & Filter Controls
  const [brokerLocation, setBrokerLocation] = useState<LocationPoint>(DEFAULT_BROKER_LOCATION);
  const [selectedRadius, setSelectedRadius] = useState<number | null>(10);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [kycFilter, setKycFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"priority" | "distance" | "name">("priority");
  const [viewMode, setViewMode] = useState<"list" | "map">("map");

  // Geolocation state
  const [geoStatus, setGeoStatus] = useState<"idle" | "requesting" | "success" | "denied" | "error">("idle");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locationTimestamp, setLocationTimestamp] = useState<Date | null>(null);

  // Candidate customers & Selection
  const [candidates, setCandidates] = useState<CandidateCustomerOut[]>(SHOWCASE_NEARBY_CUSTOMERS);
  const [selectedCustomer, setSelectedCustomer] = useState<CandidateCustomerOut | null>(SHOWCASE_NEARBY_CUSTOMERS[0]);
  const [candidatesLoading, setCandidatesLoading] = useState<boolean>(false);
  const [excludedMissingCount, setExcludedMissingCount] = useState<number>(0);

  // Navigation active state
  const [navActive, setNavActive] = useState<boolean>(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Request browser geolocation
  const requestBrowserLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoError("Unable to access your current location.");
      setGeoStatus("error");
      return;
    }

    setGeoStatus("requesting");
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: LocationPoint = {
          name: "ตำแหน่งปัจจุบันของคุณ (Live Device GPS)",
          address: "พิกัดสดจากอุปกรณ์ของคุณ",
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setBrokerLocation(coords);
        setGeoStatus("success");
        setGeoError(null);
        setLocationTimestamp(new Date());
      },
      (err) => {
        console.warn("Geolocation error:", err.code, err.message);
        if (err.code === 1) {
          setGeoStatus("denied");
          setGeoError("ไม่สามารถเข้าถึงตำแหน่งของคุณได้");
        } else if (err.code === 2) {
          setGeoStatus("error");
          setGeoError("ไม่สามารถระบุตำแหน่งได้ในขณะนี้ (Position unavailable)");
        } else {
          setGeoStatus("error");
          setGeoError("หมดเวลาค้นหาตำแหน่ง (Timeout) — ลองอีกครั้ง");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // Check auth, initial user, and auto-request geolocation once on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    api.auth.me()
      .then((me) => {
        if (me) setUser(me as User);
      })
      .catch(() => {
        clearTokens();
        router.push("/login");
      });

    // Auto-request browser geolocation on first load
    if (typeof window !== "undefined" && navigator.geolocation) {
      requestBrowserLocation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Load candidates from backend or fallback to rich showcase data
  useEffect(() => {
    let cancelled = false;

    const fetchCandidates = async () => {
      setCandidatesLoading(true);
      try {
        const res = await api.visitPlanner.getNearbyCustomers({
          broker_lat: brokerLocation.latitude,
          broker_lng: brokerLocation.longitude,
          radius_km: selectedRadius !== null ? selectedRadius : 10,
          sort_by: sortBy === "priority" ? "priority" : "distance",
          limit: 100,
          location_source: geoStatus === "success" ? "browser_gps" : "office_hub",
        });

        if (cancelled) return;

        // Track how many customers had missing location (backend reports this)
        setExcludedMissingCount(res?.excluded_missing_location_count ?? 0);

        if (res && res.items && res.items.length > 0) {
          // Merge backend items with showcase rich details
          const merged: CandidateCustomerOut[] = res.items.map((item, idx) => {
            const showcaseMatch = SHOWCASE_NEARBY_CUSTOMERS.find(
              (s) => s.external_ref === item.external_ref || s.customer_name === item.customer_name
            );
            return {
              ...item,
              location_available: true,
              routable: true,
              age: showcaseMatch?.age ?? (25 + (idx % 30)),
              occupation: showcaseMatch?.occupation ?? "ผู้ประกอบการ / พนักงานบริษัท",
              phone: showcaseMatch?.phone ?? "08X-XXX-4567",
              email: showcaseMatch?.email ?? `${item.external_ref.toLowerCase()}@example.com`,
              product_tags: showcaseMatch?.product_tags ?? ["Health", "Savings"],
              contact_history: showcaseMatch?.contact_history ?? {
                last_call: "3 ก.ย. 2569",
                last_call_detail: "ติดต่อประสานงาน",
                appointment: "10 ก.ย. 2569",
                appointment_detail: "นัดหมายล่วงหน้า",
                sent_doc: "28 ส.ค. 2569",
                sent_doc_detail: "เอกสารสรุปความคุ้มครอง",
              },
              ai_note: showcaseMatch?.ai_note ?? item.why_now ?? "ลูกค้ามีศักยภาพ แนะนำติดต่อและทบทวนความคุ้มครอง",
            };
          });

          // Ensure Showcase customer KS-00002 is present
          if (!merged.some((m) => m.external_ref === "KS-00002")) {
            merged.unshift(SHOWCASE_NEARBY_CUSTOMERS[0]);
          }

          setCandidates(merged);
          setSelectedCustomer((prev) => prev || merged[0]);
        } else {
          setCandidates(SHOWCASE_NEARBY_CUSTOMERS);
          setSelectedCustomer((prev) => prev || SHOWCASE_NEARBY_CUSTOMERS[0]);
        }
      } catch (err: unknown) {
        console.warn("getNearbyCustomers fallback to showcase data:", err);
        if (!cancelled) {
          setCandidates(SHOWCASE_NEARBY_CUSTOMERS);
          setSelectedCustomer((prev) => prev || SHOWCASE_NEARBY_CUSTOMERS[0]);
        }
      } finally {
        if (!cancelled) {
          setCandidatesLoading(false);
        }
      }
    };

    void fetchCandidates();

    return () => {
      cancelled = true;
    };
  // geoStatus intentionally excluded — location_source is a label only
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brokerLocation, selectedRadius, sortBy]);

  // Filter candidates based on user selections
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      // Priority filter
      if (priorityFilter === "high" && c.priority_level !== "high") return false;
      if (priorityFilter === "medium" && c.priority_level !== "medium") return false;
      if (priorityFilter === "low" && c.priority_level !== "low") return false;

      // Product filter
      if (productFilter !== "all") {
        const hasTag = c.product_tags?.some((t) => t.toLowerCase().includes(productFilter.toLowerCase()));
        if (!hasTag && !c.why_now?.toLowerCase().includes(productFilter.toLowerCase())) return false;
      }

      // KYC filter
      if (kycFilter === "verified" && c.kyc_status !== "verified") return false;
      if (kycFilter === "pending" && c.kyc_status !== "pending") return false;

      // Radius filter (backend already filters, but re-apply for local filter changes)
      if (selectedRadius !== null && c.distance_km && c.distance_km > selectedRadius) return false;

      return true;
    });
  }, [candidates, priorityFilter, productFilter, kycFilter, selectedRadius]);

  // Dynamic KPI stats computed from actual filtered candidates
  const dynamicKpiStats = useMemo(() => ({
    totalNearby: filteredCandidates.length,
    highPriorityCount: filteredCandidates.filter((c) => c.priority_level === "high" || (c.priority_score ?? 0) >= 75).length,
    followUpWithin7DaysCount: filteredCandidates.filter((c) =>
      c.why_now?.includes("วัน") && (c.priority_level === "high" || (c.priority_score ?? 0) >= 70)
    ).length,
    kycCount: filteredCandidates.filter((c) => c.kyc_status === "verified").length,
    recommendationOpportunityCount: filteredCandidates.filter((c) => c.recommended_next_action || c.why_now).length,
  }), [filteredCandidates]);

  // Sort candidates
  const sortedCandidates = useMemo(() => {
    const list = [...filteredCandidates];
    if (sortBy === "priority") {
      list.sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0));
    } else if (sortBy === "distance") {
      list.sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));
    } else if (sortBy === "name") {
      list.sort((a, b) => a.customer_name.localeCompare(b.customer_name, "th"));
    }
    return list;
  }, [filteredCandidates, sortBy]);

  // Paged candidates
  const totalPages = Math.max(1, Math.ceil(sortedCandidates.length / pageSize));
  const pagedCandidates = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCandidates.slice(start, start + pageSize);
  }, [sortedCandidates, currentPage, pageSize]);

  // Handle select customer
  const handleSelectCustomer = (cust: CandidateCustomerOut) => {
    setSelectedCustomer(cust);
    setNavActive(false);
  };

  // Complete visit lifecycle
  const handleCompleteVisit = (cust: CandidateCustomerOut) => {
    setNavActive(false);
    if (cust.latitude && cust.longitude) {
      setBrokerLocation({
        name: `เสร็จสิ้นการเข้าพบ ${cust.customer_name}`,
        address: cust.address || "ตำแหน่งล่าสุด",
        latitude: cust.latitude,
        longitude: cust.longitude,
      });
    }
    // Select next available candidate
    const nextCandidate = sortedCandidates.find((c) => c.customer_id !== cust.customer_id) || null;
    setSelectedCustomer(nextCandidate);
  };

  // Cancel navigation handler
  const handleCancelNavigation = () => {
    setNavActive(false);
  };

  return (
    <AppShell
      user={user}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.125rem",
              flexShrink: 0,
              boxShadow: "0 2px 6px rgba(29,78,216,0.3)",
            }}
          >
            📍
          </div>
          <div>
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "#0F172A",
                margin: 0,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              แผนที่ลูกค้ารอบตัว
            </h1>
            <div style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 500 }}>
              ค้นพบโอกาสใหม่ด้วยพลัง AI • คุณเป็นผู้ตัดสินใจ
            </div>
          </div>
        </div>
      }
      actions={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            backgroundColor: "#F1F5F9",
            borderRadius: "10px",
            padding: "3px",
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode("list")}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "0.8125rem",
              fontWeight: 700,
              border: "none",
              backgroundColor: viewMode === "list" ? "#ffffff" : "transparent",
              color: viewMode === "list" ? "#0F172A" : "#64748B",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              transition: "all 0.15s ease",
              boxShadow: viewMode === "list" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            <span>☰</span>
            <span>รายการ</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("map")}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "0.8125rem",
              fontWeight: 700,
              border: "none",
              backgroundColor: viewMode === "map" ? "#1D4ED8" : "transparent",
              color: viewMode === "map" ? "#ffffff" : "#64748B",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              transition: "all 0.15s ease",
              boxShadow: viewMode === "map" ? "0 2px 6px rgba(29,78,216,0.3)" : "none",
            }}
          >
            <span>🗺️</span>
            <span>แผนที่</span>
          </button>
        </div>
      }
    >
      <div style={{ maxWidth: "1680px", margin: "0 auto", paddingBottom: "32px" }}>
        {/* Geolocation Denied Banner */}
        {geoError && (
          <div
            style={{
              background: "linear-gradient(135deg, #FEF2F2 0%, #FFF1F2 100%)",
              border: "1px solid #FECACA",
              borderLeft: "4px solid #DC2626",
              borderRadius: "10px",
              padding: "10px 16px",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.125rem" }}>⚠️</span>
              <div>
                <div style={{ fontSize: "0.8125rem", fontWeight: 800, color: "#991B1B" }}>
                  Unable to access your current location.
                </div>
                <div style={{ fontSize: "0.75rem", color: "#B91C1C" }}>
                  ระบบใช้ตำแหน่งจุดอ้างอิงที่เลือกแทน โดยไม่สร้างพิกัดปลอม
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={requestBrowserLocation}
              style={{
                backgroundColor: "#DC2626",
                border: "none",
                color: "#ffffff",
                borderRadius: "8px",
                padding: "6px 12px",
                fontSize: "0.75rem",
                cursor: "pointer",
                fontWeight: 700,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              ขอสิทธิ์อีกครั้ง
            </button>
          </div>
        )}

        {/* 1. Horizontal Filter Controls Bar */}
        <NearbyFilterBar
          currentLocation={brokerLocation}
          onLocationChange={setBrokerLocation}
          radiusKm={selectedRadius}
          onRadiusChange={setSelectedRadius}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          productFilter={productFilter}
          onProductFilterChange={setProductFilter}
          kycFilter={kycFilter}
          onKycFilterChange={setKycFilter}
          onRequestGeolocation={requestBrowserLocation}
          geoStatus={geoStatus}
          locationTimestamp={locationTimestamp}
        />

        {/* 2. Top 5 Metric KPI Cards — dynamic from actual filtered candidates */}
        <NearbyMetricsRow
          stats={dynamicKpiStats}
          radiusKm={selectedRadius}
          locationTimestamp={locationTimestamp}
        />

        {/* 3. Main 3-Column Cockpit Workspace */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: viewMode === "list" ? "1fr 1fr" : "340px 1fr 380px",
            gap: "18px",
            alignItems: "stretch",
            minHeight: "720px",
          }}
          className="nearby-main-grid"
        >
          {/* Column 1: รายชื่อลูกค้าใกล้คุณ */}
          <div data-tour="customer-selection-action" style={{ display: "flex", flexDirection: "column" }} className="col-nearby-list">
            <NearbyCustomerList
              customers={pagedCandidates}
              selectedCustomerId={selectedCustomer?.customer_id ?? null}
              onSelectCustomer={handleSelectCustomer}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={dynamicKpiStats.totalNearby}
              onPageChange={setCurrentPage}
              loading={candidatesLoading}
              excludedMissingCount={excludedMissingCount}
              radiusKm={selectedRadius}
              onIncreaseRadius={() => setSelectedRadius((r) => Math.min((r ?? 10) + 10, 20))}
              navActive={navActive}
            />
          </div>

          {/* Column 2: แผนที่ลูกค้ารอบตัว (Proximity Map) */}
          {viewMode === "map" && (
            <div data-tour="nearby-customers-map" style={{ display: "flex", flexDirection: "column" }} className="col-nearby-map">
              <NearbyMapVisualizer
                brokerLocation={brokerLocation}
                radiusKm={selectedRadius}
                customers={sortedCandidates}
                selectedCustomerId={selectedCustomer?.customer_id ?? null}
                onSelectCustomer={handleSelectCustomer}
                totalCount={SHOWCASE_KPI_STATS.totalNearby}
                height="100%"
                navActive={navActive}
              />
            </div>
          )}

          {/* Column 3: ข้อมูลลูกค้า / เส้นทาง (Customer Detail & Decision Panel) */}
          <div data-tour="navigation-preview-action" style={{ display: "flex", flexDirection: "column" }} className="col-nearby-detail">
            <CustomerDecisionPanel
              selectedCustomer={selectedCustomer}
              brokerLocation={brokerLocation}
              onViewCustomerDetail={() => {
                if (selectedCustomer) {
                  router.push(`/customers/${selectedCustomer.customer_id}`);
                }
              }}
              onCompleteVisit={handleCompleteVisit}
              onCancelNavigation={handleCancelNavigation}
              onNavActiveChange={setNavActive}
            />
          </div>
        </div>
      </div>

      {/* Responsive Styles */}
      <style jsx global>{`
        @media (max-width: 1400px) {
          .nearby-main-grid {
            grid-template-columns: 320px 1fr 340px !important;
          }
        }
        @media (max-width: 1200px) {
          .nearby-metrics-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .nearby-main-grid {
            display: flex !important;
            flex-direction: column !important;
          }
          .col-nearby-list, .col-nearby-map, .col-nearby-detail {
            width: 100% !important;
            min-height: 520px;
          }
        }
        @media (max-width: 768px) {
          .nearby-metrics-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .nearby-filter-bar {
            flex-direction: column !important;
            align-items: stretch !important;
          }
        }
      `}</style>
    </AppShell>
  );
}
