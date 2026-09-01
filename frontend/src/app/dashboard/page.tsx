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
  Skeleton,
  TableSkeleton,
  EmptyState,
  Alert,
  Status,
  Tooltip,
} from "@/components/ui";
import { PageHeader, PriorityScore } from "@/components/domain";

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

  const loadData = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [me, sumData, custList, fuList] = await Promise.all([
        api.auth.me(),
        api.dashboard.summary(),
        api.customers.list(1, 100),
        api.followups.list().catch(() => []),
      ]);
      setUser(me as User);
      setSummary(sumData);
      setCustomers(custList.items);
      setFollowups(Array.isArray(fuList) ? fuList : []);
    } catch (err: any) {
      if (err?.message?.includes("Session expired") || !isAuthenticated()) {
        clearTokens();
        router.push("/login");
      } else {
        setError(err?.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadData();
  }, [loadData, router]);

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
  const highCount = summary?.priority_breakdown?.high ?? customers.filter((c) => c.priority_level === "high").length;
  const medCount = summary?.priority_breakdown?.medium ?? customers.filter((c) => c.priority_level === "medium").length;
  const pendingKycCount = summary?.kyc_breakdown?.pending ?? customers.filter((c) => c.kyc_status === "pending").length;
  const openFollowups = summary?.open_followups_count ?? followups.filter((f) => f.status === "open").length;
  const overdueFollowups = summary?.overdue_followups_count ?? followups.filter((f) => f.payment_status === "overdue" || (f as any).is_overdue).length;

  // Active followups list for Today's Tasks
  const activeFollowups = useMemo(() => {
    return followups.filter((f) => f.status === "open").slice(0, 5);
  }, [followups]);

  // Suggested next action helper based on actual customer state
  const getNextActionLabel = (customer: CustomerListItem) => {
    if (customer.has_overdue_followup) return "ติดต่อติดตามผล";
    if (customer.kyc_status === "pending") return "ตรวจสอบข้อมูล KYC";
    if (customer.priority_level === "high") return "ทบทวนความคุ้มครอง";
    if (customer.active_policies_count === 0) return "นำเสนอแผนประกัน";
    return "ดูแลความสัมพันธ์";
  };

  return (
    <AppShell user={user}>
      {/* ── 1. Page Header ── */}
      <PageHeader
        title="แดชบอร์ดการทำงานนายหน้า (Broker Workspace)"
        description={`ยินดีต้อนรับ ${user?.full_name || "นายหน้า"} · ดูแลลูกค้าที่สำคัญและติดตามงานของคุณในวันนี้`}
        primaryAction={
          <Button variant="primary" size="sm" leftIcon="🔄" onClick={loadData} isLoading={loading}>
            รีเฟรชข้อมูล
          </Button>
        }
        secondaryAction={
          <Link href="/customers">
            <Button variant="outline" size="sm" leftIcon="👥">
              รายชื่อลูกค้าทั้งหมด
            </Button>
          </Link>
        }
      />

      {error && (
        <Alert variant="danger" style={{ marginBottom: "var(--space-5)" }} action={<Button size="sm" onClick={loadData}>ลองใหม่</Button>}>
          {error}
        </Alert>
      )}

      {/* ── 2. Today's Priority Summary (Actionable KPI Strip) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--space-4)",
          marginBottom: "var(--space-6)",
        }}
      >
        {/* KPI 1: High Priority (Clickable) */}
        <Link href="/customers?priority=high" style={{ textDecoration: "none", color: "inherit" }}>
          <Card
            variant="metric"
            noPadding
            style={{
              cursor: "pointer",
              transition: "transform var(--motion-fast), box-shadow var(--motion-fast)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "none";
              (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-xs)";
            }}
          >
            <div style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", color: "var(--slate-500)", letterSpacing: "0.05em" }}>
                  ลูกค้าความสำคัญสูง
                </div>
                <div style={{ fontSize: "var(--fs-3xl)", fontWeight: 800, color: "var(--priority-high-text)", marginTop: "4px" }}>
                  {loading ? <Skeleton width="48px" height="36px" /> : highCount}
                </div>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--primary-700)", marginTop: "2px", fontWeight: 600 }}>
                  คลิกเพื่อดูรายชื่อคัดกรอง →
                </div>
              </div>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  backgroundColor: "var(--priority-high-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  color: "var(--priority-high-solid)",
                }}
              >
                ⚡
              </div>
            </div>
          </Card>
        </Link>

        {/* KPI 2: Follow-ups Due */}
        <Card noPadding>
          <div style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", color: "var(--slate-500)", letterSpacing: "0.05em" }}>
                นัดหมายที่ต้องติดตาม (Follow-ups)
              </div>
              <div style={{ fontSize: "var(--fs-3xl)", fontWeight: 800, color: "var(--primary-700)", marginTop: "4px" }}>
                {loading ? <Skeleton width="48px" height="36px" /> : openFollowups}
              </div>
              <div style={{ fontSize: "var(--fs-xs)", color: overdueFollowups > 0 ? "var(--danger-solid)" : "var(--slate-500)", marginTop: "2px", fontWeight: overdueFollowups > 0 ? 700 : 400 }}>
                {overdueFollowups > 0 ? `⚠️ เกินกำหนด ${overdueFollowups} รายการ` : "เปิดค้างในระบบ"}
              </div>
            </div>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                backgroundColor: "var(--primary-50)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                color: "var(--primary-600)",
              }}
            >
              📅
            </div>
          </div>
        </Card>

        {/* KPI 3: Pending KYC / Reviews (Clickable) */}
        <Link href="/customers?kyc=pending" style={{ textDecoration: "none", color: "inherit" }}>
          <Card
            noPadding
            style={{
              cursor: "pointer",
              transition: "transform var(--motion-fast), box-shadow var(--motion-fast)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "none";
              (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-xs)";
            }}
          >
            <div style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", color: "var(--slate-500)", letterSpacing: "0.05em" }}>
                  รอตรวจสอบข้อมูล (Pending KYC)
                </div>
                <div style={{ fontSize: "var(--fs-3xl)", fontWeight: 800, color: "var(--warning-solid)", marginTop: "4px" }}>
                  {loading ? <Skeleton width="48px" height="36px" /> : pendingKycCount}
                </div>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "2px" }}>
                  ต้องอัปเดตสถานะยืนยันตัวตน
                </div>
              </div>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  backgroundColor: "var(--warning-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  color: "var(--warning-solid)",
                }}
              >
                📋
              </div>
            </div>
          </Card>
        </Link>

        {/* KPI 4: Total Portfolio Customers (Clickable) */}
        <Link href="/customers" style={{ textDecoration: "none", color: "inherit" }}>
          <Card
            noPadding
            style={{
              cursor: "pointer",
              transition: "transform var(--motion-fast), box-shadow var(--motion-fast)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "none";
              (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-xs)";
            }}
          >
            <div style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", color: "var(--slate-500)", letterSpacing: "0.05em" }}>
                  ลูกค้ารวมในพอร์ต
                </div>
                <div style={{ fontSize: "var(--fs-3xl)", fontWeight: 800, color: "var(--slate-800)", marginTop: "4px" }}>
                  {loading ? <Skeleton width="48px" height="36px" /> : summary?.total_customers ?? customers.length}
                </div>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "2px" }}>
                  กรมธรรม์ Active รวม {summary?.total_active_policies ?? 0} ฉบับ
                </div>
              </div>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  backgroundColor: "var(--slate-100)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  color: "var(--slate-600)",
                }}
              >
                👥
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* ── 3. Main Layout: Priority Customer Queue (Left) + Tasks & Alerts (Right) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 360px",
          gap: "var(--space-6)",
          alignItems: "start",
        }}
      >
        {/* ── Left Column: Priority Customer Queue (Highest Visual Emphasis) ── */}
        <div style={{ minWidth: 0 }}>
          <Card
            title="ลูกค้าที่ควรให้ความสนใจ (Priority Customer Queue)"
            subtitle="ระบบจัดลำดับความสำคัญตามโอกาสและความจำเป็นในการติดต่อเพื่อประกอบการตัดสินใจของนายหน้า"
            headerAction={
              <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
                {/* Search input */}
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ หรือ รหัสลูกค้า..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    height: "32px",
                    padding: "0 10px",
                    fontSize: "var(--fs-xs)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--bg-surface-subtle)",
                    color: "var(--slate-800)",
                    outline: "none",
                    width: "180px",
                  }}
                />

                {/* Priority Filter pills */}
                <div style={{ display: "flex", gap: "2px", backgroundColor: "var(--slate-100)", padding: "2px", borderRadius: "var(--radius-md)" }}>
                  {[
                    { id: "all", label: "ทั้งหมด" },
                    { id: "high", label: "สูง" },
                    { id: "medium", label: "ปานกลาง" },
                    { id: "low", label: "ต่ำ" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setPriorityFilter(tab.id)}
                      style={{
                        padding: "4px 8px",
                        fontSize: "0.6875rem",
                        fontWeight: priorityFilter === tab.id ? 700 : 500,
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: priorityFilter === tab.id ? "var(--white)" : "transparent",
                        color: priorityFilter === tab.id ? "var(--slate-900)" : "var(--slate-600)",
                        boxShadow: priorityFilter === tab.id ? "var(--shadow-xs)" : "none",
                        transition: "all var(--motion-fast)",
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
                <span style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)" }}>
                  แสดง {filteredQueue.slice(0, 10).length} รายชื่อที่สำคัญที่สุด
                </span>
                <Link href="/customers">
                  <Button variant="ghost" size="sm" style={{ color: "var(--primary-700)", fontWeight: 700 }}>
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
                    <TableHeadCell>เหตุผลที่ระบบจัดลำดับ</TableHeadCell>
                    <TableHeadCell>การดำเนินการถัดไป</TableHeadCell>
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
                              color: "var(--primary-700)",
                              fontSize: "var(--fs-sm)",
                            }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = "underline")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = "none")}
                          >
                            {c.full_name}
                          </Link>
                          <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "2px", display: "flex", gap: "6px" }}>
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

                      {/* Top Human-Readable Reason */}
                      <TableCell>
                        <div
                          style={{
                            fontSize: "var(--fs-xs)",
                            color: "var(--slate-700)",
                            maxWidth: "220px",
                            lineHeight: 1.4,
                          }}
                        >
                          {c.score_short_reason || "พร้อมวิเคราะห์ความต้องการ"}
                        </div>
                      </TableCell>

                      {/* Suggested Next Action */}
                      <TableCell>
                        <span
                          style={{
                            fontSize: "var(--fs-xs)",
                            fontWeight: 600,
                            color: "var(--slate-800)",
                            backgroundColor: "var(--slate-100)",
                            padding: "3px 8px",
                            borderRadius: "var(--radius-sm)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {getNextActionLabel(c)}
                        </span>
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
                            <span style={{ fontSize: "10px", color: "var(--danger-solid)", fontWeight: 700 }}>
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

        {/* ── Right Column: Important Alerts + Today's Tasks + Quick Actions ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>

          {/* ── Important Alerts Card ── */}
          {(overdueFollowups > 0 || pendingKycCount > 0) && (
            <Card
              title="⚠️ การแจ้งเตือนที่ต้องใส่ใจ"
              subtitle="รายการที่ต้องการการตรวจสอบหรือการดำเนินการเร่งด่วน"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {overdueFollowups > 0 && (
                  <div
                    style={{
                      padding: "10px 12px",
                      backgroundColor: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "var(--radius-md)",
                      fontSize: "var(--fs-xs)",
                      color: "#991b1b",
                      display: "flex",
                      gap: "8px",
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>⚠️</span>
                    <div>
                      <strong>มีนัดหมายเกินกำหนด {overdueFollowups} รายการ</strong>
                      <div style={{ marginTop: "2px", color: "#b91c1c" }}>
                        กรุณาเปิดตรวจสอบและติดต่อลูกค้าเพื่ออัปเดตผลการนัดหมาย
                      </div>
                    </div>
                  </div>
                )}

                {pendingKycCount > 0 && (
                  <div
                    style={{
                      padding: "10px 12px",
                      backgroundColor: "var(--warning-bg)",
                      border: "1px solid var(--warning-border)",
                      borderRadius: "var(--radius-md)",
                      fontSize: "var(--fs-xs)",
                      color: "var(--warning-text)",
                      display: "flex",
                      gap: "8px",
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>📋</span>
                    <div>
                      <strong>ลูกค้ารอตรวจสอบ KYC {pendingKycCount} รายการ</strong>
                      <div style={{ marginTop: "2px" }}>
                        <Link href="/customers?kyc=pending" style={{ textDecoration: "underline", fontWeight: 700 }}>
                          เปิดดูรายชื่อที่รอตรวจสอบ →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ── Today's Tasks Card ── */}
          <Card
            title="📋 งานที่ต้องทำวันนี้ (Today's Tasks)"
            subtitle="รายการนัดหมายและการติดตามผลที่ค้างอยู่"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {activeFollowups.length > 0 ? (
                activeFollowups.map((fu) => (
                  <div
                    key={fu.id}
                    style={{
                      padding: "10px 12px",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--bg-surface)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--slate-800)" }}>
                        {fu.follow_up_window || "นัดหมายติดตาม"}
                      </span>
                      <Badge variant={fu.status === "open" ? "warning" : "success"} size="sm">
                        {fu.status}
                      </Badge>
                    </div>

                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-600)", lineHeight: 1.4 }}>
                      {fu.notes || "ติดตามผลความคุ้มครองและข้อเสนอแนะ"}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "6px", marginTop: "2px" }}>
                      <span style={{ fontSize: "11px", color: "var(--slate-500)" }}>
                        กำหนด: {fu.renewal_date || fu.last_contact_date || "-"}
                      </span>
                      <Link href={`/customers/${fu.customer_id}`}>
                        <Button variant="outline" size="sm" style={{ padding: "0 8px", height: "24px", fontSize: "11px" }}>
                          เปิดงาน
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "16px 0", color: "var(--slate-500)", fontSize: "var(--fs-xs)" }}>
                  ยังไม่มีงานติดตามที่ค้างอยู่ ✓
                </div>
              )}
            </div>
          </Card>

          {/* ── Quick Actions Card ── */}
          <Card
            title="⚡ เครื่องมือด่วน (Quick Actions)"
            subtitle="ทางลัดสู่กระบวนการทำงานหลัก"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <Link href="/customers" style={{ width: "100%" }}>
                <Button variant="outline" size="md" style={{ width: "100%", justifyContent: "flex-start" }} leftIcon="👥">
                  เปิดรายชื่อลูกค้าทั้งหมด (Directory)
                </Button>
              </Link>
              <Link href="/chat" style={{ width: "100%" }}>
                <Button variant="outline" size="md" style={{ width: "100%", justifyContent: "flex-start" }} leftIcon="💬">
                  เปิด AI Copilot ผู้ช่วยเตรียมบทสนทนา
                </Button>
              </Link>
            </div>
          </Card>

          {/* ── System Status Card ── */}
          <Card noPadding>
            <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#16a34a", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--slate-800)" }}>
                  ระบบ AI พร้อมสนับสนุนการทำงาน ✓
                </div>
                <div style={{ fontSize: "11px", color: "var(--slate-500)", marginTop: "1px" }}>
                  LightGBM Scoring · Need Analysis · Product Matcher
                </div>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </AppShell>
  );
}
