"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { clearTokens, isAuthenticated } from "@/lib/auth";
import type { CustomerListItem, DashboardSummary, FollowUp, User } from "@/types";
import { AppShell } from "@/components/layout";
import {
  Card,
  Badge,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeadCell,
  TableCell,
  TableSkeleton,
  EmptyState,
  Alert,
  Status,
} from "@/components/ui";
import { PriorityScore, DemoPersonaStrip, TrustedAdvisorBadge } from "@/components/domain";
import {
  DashboardHeroBanner,
  DashboardMetricsRow,
  FocusCustomerCards,
  AIRecommendationWidget,
} from "@/components/dashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleRefresh = useCallback(() => {
    setError(null);
    setLoading(true);
    Promise.all([
      api.auth.me(),
      api.dashboard.summary().catch(() => null),
      api.customers.list(1, 300).catch(() => ({ items: [], total: 0 })),
      api.followups.list().catch(() => []),
    ])
      .then(([me, sumData, custList, fuList]) => {
        if (me) setUser(me as User);
        if (sumData) setSummary(sumData);
        if (custList?.items) setCustomers(custList.items);
        if (Array.isArray(fuList)) setFollowups(fuList);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("Session expired") || !isAuthenticated()) {
          clearTokens();
          router.push("/login");
        } else {
          setError(msg || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
        }
        setLoading(false);
      });
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    let isMounted = true;
    Promise.all([
      api.auth.me(),
      api.dashboard.summary().catch(() => null),
      api.customers.list(1, 300).catch(() => ({ items: [], total: 0 })),
      api.followups.list().catch(() => []),
    ])
      .then(([me, sumData, custList, fuList]) => {
        if (!isMounted) return;
        if (me) setUser(me as User);
        if (sumData) setSummary(sumData);
        if (custList?.items) setCustomers(custList.items);
        if (Array.isArray(fuList)) setFollowups(fuList);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("Session expired") || !isAuthenticated()) {
          clearTokens();
          router.push("/login");
        } else {
          setError(msg || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
        }
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Filter queue customers
  const filteredQueue = useMemo(() => {
    return customers.filter((c) => {
      const matchesPriority = priorityFilter === "all" || c.priority_level === priorityFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.external_ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.score_short_reason && c.score_short_reason.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesPriority && matchesSearch;
    });
  }, [customers, priorityFilter, searchQuery]);

  // Compute counts from actual data
  const highCount =
    summary?.priority_breakdown?.high ??
    customers.filter((c) => c.priority_level === "high").length;
  const medCount =
    summary?.priority_breakdown?.medium ??
    customers.filter((c) => c.priority_level === "medium").length;
  const pendingKycCount =
    summary?.kyc_breakdown?.pending ??
    customers.filter((c) => c.kyc_status === "pending").length;
  const openFollowups =
    summary?.open_followups_count ??
    followups.filter((f) => f.status === "open").length;
  const overdueFollowups =
    summary?.overdue_followups_count ??
    followups.filter((f) => f.payment_status === "overdue" || (f as any).is_overdue).length;

  // Active followups list for Today's Tasks
  const activeFollowups = useMemo(() => {
    return followups.filter((f) => f.status === "open").slice(0, 5);
  }, [followups]);

  // Suggested next action helper based on actual customer state
  const getNextActionLabel = (customer: CustomerListItem) => {
    if (customer.recommended_action) return customer.recommended_action;
    if (customer.has_overdue_followup) return "ติดต่อติดตามผล";
    if (customer.kyc_status === "pending") return "ตรวจสอบข้อมูล KYC";
    if (customer.priority_level === "high") return "ทบทวนความคุ้มครอง";
    if (customer.active_policies_count === 0) return "นำเสนอแผนประกัน";
    return "ดูแลความสัมพันธ์";
  };

  return (
    <AppShell user={user} title="แดชบอร์ดภาพรวม">
      {error && (
        <Alert
          variant="danger"
          style={{ marginBottom: "16px" }}
          action={
            <Button size="sm" onClick={handleRefresh} isLoading={loading}>
              ลองใหม่
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* ── Dashboard Overview Container (Tour Target) ── */}
      <div data-tour="dashboard" id="tour-dashboard-overview">
        {/* ── 1. Panoramic Morning Briefing Hero Banner (Mockup Design) ── */}
        <DashboardHeroBanner
          user={user}
          highPriorityCount={highCount}
          tasksCount={openFollowups}
        />

        {/* ── 2. Row of 4 KPI Metric Cards (Mockup Design with Live Data) ── */}
        <DashboardMetricsRow
          highPriorityCount={highCount}
          followupsCount={openFollowups}
          pendingKycCount={pendingKycCount}
          totalCustomersCount={summary?.total_customers ?? customers.length}
          activePoliciesCount={summary?.total_active_policies ?? 382}
        />
      </div>

      {/* ── Demo Persona Switcher Strip (Hackathon Testing) ── */}
      <DemoPersonaStrip />

      {/* ── 3. Quick-glance Focus Customers Row ── */}
      <FocusCustomerCards customers={customers} />

      {/* ── 4. Main Workspace Layout: Priority Customer Queue (Left) + Intelligence & Tasks (Right) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 360px",
          gap: "24px",
          alignItems: "start",
        }}
        className="dashboard-middle-section"
      >
        {/* ── Left Column: Actionable Priority Customer Queue (Full Data) ── */}
        <div style={{ minWidth: 0 }}>
          <Card
            title="ลูกค้าที่ควรให้ความสนใจ (Priority Customer Queue)"
            subtitle="ระบบจัดลำดับความสำคัญตามโอกาสและความจำเป็นในการติดต่อเพื่อประกอบการตัดสินใจของนายหน้า"
            headerAction={
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                {/* Search input */}
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ หรือ รหัสลูกค้า..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    height: "32px",
                    padding: "0 10px",
                    fontSize: "0.8125rem",
                    border: "1px solid #E2E8F0",
                    borderRadius: "6px",
                    backgroundColor: "#F8FAFC",
                    color: "#0F172A",
                    outline: "none",
                    width: "180px",
                  }}
                />

                {/* Priority Filter pills */}
                <div style={{ display: "flex", gap: "2px", backgroundColor: "#F1F5F9", padding: "2px", borderRadius: "6px" }}>
                  {[
                    { id: "all", label: `ทั้งหมด (${customers.length})` },
                    { id: "high", label: `สูง (${highCount})` },
                    { id: "medium", label: `ปานกลาง (${medCount})` },
                    { id: "low", label: "ต่ำ" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setPriorityFilter(tab.id)}
                      style={{
                        padding: "4px 8px",
                        fontSize: "0.75rem",
                        fontWeight: priorityFilter === tab.id ? 700 : 500,
                        borderRadius: "4px",
                        border: "none",
                        backgroundColor: priorityFilter === tab.id ? "#ffffff" : "transparent",
                        color: priorityFilter === tab.id ? "#0F172A" : "#64748B",
                        boxShadow: priorityFilter === tab.id ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            }
            footer={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                  แสดง {filteredQueue.slice(0, 10).length} จากทั้งหมด {filteredQueue.length} รายชื่อ
                </span>
                <Link href="/customers">
                  <Button variant="ghost" size="sm" style={{ color: "#5a4544", fontWeight: 700 }}>
                    ดูลูกค้าทั้งหมด ({customers.length}) →
                  </Button>
                </Link>
              </div>
            }
            noPadding
          >
            {loading ? (
              <TableSkeleton rows={6} cols={6} />
            ) : filteredQueue.length > 0 ? (
              <Table density="comfortable">
                <TableHeader>
                  <TableRow hover={false}>
                    <TableHeadCell>ลูกค้า</TableHeadCell>
                    <TableHeadCell>ลำดับความสำคัญ</TableHeadCell>
                    <TableHeadCell>🔔 ทำไมต้องตอนนี้ (Why now?)</TableHeadCell>
                    <TableHeadCell>Advisor Action</TableHeadCell>
                    <TableHeadCell>สถานะ</TableHeadCell>
                    <TableHeadCell align="right">การดำเนินการ</TableHeadCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQueue.slice(0, 10).map((c) => (
                    <TableRow key={c.id}>
                      {/* Customer Name & Info */}
                      <TableCell>
                        <div>
                          <Link
                            href={`/customers/${c.id}`}
                            style={{
                              fontWeight: 700,
                              color: "#5a4544",
                              fontSize: "0.8125rem",
                              textDecoration: "none",
                            }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = "underline")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = "none")}
                          >
                            {c.full_name}
                          </Link>
                          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "2px", display: "flex", gap: "6px" }}>
                            <span>{c.external_ref}</span>
                            <span>•</span>
                            <span>{c.active_policies_count} กรมธรรม์</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Priority Score Component */}
                      <TableCell>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {c.priority_level ? (
                            <PriorityScore
                              score={c.score_display ? Math.round(c.score_display) : 0}
                              priority={c.priority_level}
                              compact
                            />
                          ) : (
                            <Badge variant="neutral" size="sm">ยังไม่ประเมิน</Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Why Now Trigger & Reason */}
                      <TableCell>
                        <div style={{ maxWidth: "280px", lineHeight: "var(--lh-reading, 1.7)" }}>
                          {c.why_now ? (
                            <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-reading-thai)", color: "#0B1E36" }}>
                              <span style={{ color: "#5a4544", fontWeight: 700, marginRight: "4px", fontFamily: "var(--font-ui-thai)" }}>🔔 Why now:</span>
                              <span>{c.why_now}</span>
                            </div>
                          ) : (
                            <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-reading-thai)", color: "#475569" }}>
                              {c.score_short_reason || "พร้อมวิเคราะห์ความต้องการ"}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Trusted Advisor Action State & Label */}
                      <TableCell>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                          {c.action_state && (
                            <TrustedAdvisorBadge
                              outcome={c.action_state}
                              size="sm"
                              pulse={c.action_state === "action"}
                            />
                          )}
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#334155",
                              fontWeight: 600,
                              lineHeight: 1.35,
                            }}
                          >
                            {getNextActionLabel(c)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <Status
                            variant={c.kyc_status === "verified" ? "healthy" : "warning"}
                            label={c.kyc_status === "verified" ? "KYC ผ่าน" : "KYC รอตรวจ"}
                            size="sm"
                          />
                          {c.has_overdue_followup && (
                            <span style={{ fontSize: "12px", color: "#DC2626", fontWeight: 700 }}>
                              ⚠️ เกินกำหนด
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Open Action */}
                      <TableCell align="right">
                        <Link href={`/customers/${c.id}`}>
                          <Button variant="primary" size="sm" leftIcon="📋">
                            เปิดข้อมูล
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                icon="🔍"
                title="ไม่มีลูกค้าที่ต้องติดตามในขณะนี้"
                description="ไม่พบลูกค้ารายการที่ตรงกับตัวกรอง ลองสลับแท็บความสำคัญหรือดูรายชื่อทั้งหมด"
                action={
                  <Link href="/customers">
                    <Button variant="outline" size="sm">
                      ดูลูกค้าทั้งหมด
                    </Button>
                  </Link>
                }
              />
            )}
          </Card>
        </div>

        {/* ── Right Column: AI Guidance + Important Alerts + Today's Tasks + Quick Actions ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* ── 1. AI Recommendation & Advice Card (Mockup Style) ── */}
          <AIRecommendationWidget />

          {/* ── 2. Important Alerts Card (Real Data) ── */}
          {(overdueFollowups > 0 || pendingKycCount > 0) && (
            <Card
              title="⚠️ การแจ้งเตือนที่ต้องใส่ใจ"
              subtitle="รายการที่ต้องการการตรวจสอบหรือการดำเนินการเร่งด่วน"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {overdueFollowups > 0 && (
                  <div
                    style={{
                      padding: "10px 12px",
                      backgroundColor: "#FEF2F2",
                      border: "1px solid #FECACA",
                      borderRadius: "8px",
                      fontSize: "0.75rem",
                      color: "#991B1B",
                      display: "flex",
                      gap: "8px",
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>⚠️</span>
                    <div>
                      <strong>มีนัดหมายเกินกำหนด {overdueFollowups} รายการ</strong>
                      <div style={{ marginTop: "2px", color: "#B91C1C" }}>
                        กรุณาเปิดตรวจสอบและติดต่อลูกค้าเพื่ออัปเดตผลการนัดหมาย
                      </div>
                    </div>
                  </div>
                )}

                {pendingKycCount > 0 && (
                  <div
                    style={{
                      padding: "10px 12px",
                      backgroundColor: "#FFFBEB",
                      border: "1px solid #FDE68A",
                      borderRadius: "8px",
                      fontSize: "0.75rem",
                      color: "#92400E",
                      display: "flex",
                      gap: "8px",
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>📋</span>
                    <div>
                      <strong>ลูกค้ารอตรวจสอบ KYC {pendingKycCount} รายการ</strong>
                      <div style={{ marginTop: "2px" }}>
                        <Link href="/customers?kyc=pending" style={{ textDecoration: "underline", fontWeight: 700, color: "#B45309" }}>
                          เปิดดูรายชื่อที่รอตรวจสอบ →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ── 3. Today's Tasks Card (Real Followups from Database) ── */}
          <Card
            title="📋 งานที่ต้องทำวันนี้ (Today's Tasks)"
            subtitle="รายการนัดหมายและการติดตามผลที่ค้างอยู่"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {activeFollowups.length > 0 ? (
                activeFollowups.map((fu) => (
                  <div
                    key={fu.id}
                    style={{
                      padding: "12px",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                      backgroundColor: "#FFFFFF",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0F172A" }}>
                        {fu.follow_up_window || "นัดหมายติดตาม"}
                      </span>
                      <Badge variant={fu.status === "open" ? "warning" : "success"} size="sm">
                        {fu.status === "open" ? "รอดำเนินการ" : "เสร็จสิ้น"}
                      </Badge>
                    </div>

                    <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-reading-thai)", color: "#475569", lineHeight: "var(--lh-reading, 1.7)" }}>
                      {fu.notes || "ติดตามผลความคุ้มครองและข้อเสนอแนะ"}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #F1F5F9", paddingTop: "8px", marginTop: "2px" }}>
                      <span style={{ fontSize: "12px", color: "#64748B" }}>
                        กำหนด: {fu.renewal_date || fu.last_contact_date || "-"}
                      </span>
                      <Link href={`/customers/${fu.customer_id}`}>
                        <Button variant="outline" size="sm" style={{ padding: "0 10px", height: "26px", fontSize: "12px", color: "#5a4544" }}>
                          เปิดงาน →
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "16px 0", color: "#64748B", fontSize: "0.75rem" }}>
                  ยังไม่มีงานติดตามที่ค้างอยู่ ✓
                </div>
              )}
            </div>
          </Card>

          {/* ── 4. Quick Actions Card ── */}
          <Card
            title="⚡ เครื่องมือด่วน (Quick Actions)"
            subtitle="ทางลัดสู่กระบวนการทำงานหลัก"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Link href="/customers" style={{ width: "100%", textDecoration: "none" }}>
                <Button variant="outline" size="md" style={{ width: "100%", justifyContent: "flex-start" }} leftIcon="👥">
                  เปิดรายชื่อลูกค้าทั้งหมด (Directory)
                </Button>
              </Link>
              <Link href="/visit-planner" style={{ width: "100%", textDecoration: "none" }}>
                <Button variant="outline" size="md" style={{ width: "100%", justifyContent: "flex-start" }} leftIcon="📍">
                  แผนที่ลูกค้ารอบตัว (Nearby Customers)
                </Button>
              </Link>
              <Link href="/model" style={{ width: "100%", textDecoration: "none" }}>
                <Button variant="outline" size="md" style={{ width: "100%", justifyContent: "flex-start" }} leftIcon="🤖">
                  ตรวจสอบสุขภาพระบบ AI (AI Health)
                </Button>
              </Link>
            </div>
          </Card>

          {/* ── 5. System Status Card ── */}
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "#FFFFFF",
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#16A34A", flexShrink: 0, boxShadow: "0 0 6px #16A34A" }} />
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0F172A" }}>
                ระบบ AI พร้อมสนับสนุนการทำงาน ✓
              </div>
              <div style={{ fontSize: "12px", color: "#64748B", marginTop: "1px" }}>
                LightGBM Scoring · Need Analysis · Product Matcher
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
