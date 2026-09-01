"use client";
import React, { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { clearTokens, isAuthenticated } from "@/lib/auth";
import type { CustomerListItem, User } from "@/types";
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
  Tooltip,
} from "@/components/ui";
import { PageHeader, PriorityScore } from "@/components/domain";

function CustomersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<User | null>(null);
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const initialPriority = searchParams.get("priority") || "all";
  const initialKyc = searchParams.get("kyc") || "all";
  const initialSearch = searchParams.get("search") || "";

  const [priorityFilter, setPriorityFilter] = useState<string>(initialPriority);
  const [kycFilter, setKycFilter] = useState<string>(initialKyc);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [sortBy, setSortBy] = useState<"priority" | "name" | "policies">("priority");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const loadData = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [me, custList] = await Promise.all([
        api.auth.me(),
        api.customers.list(1, 100),
      ]);
      setUser(me as User);
      setCustomers(custList.items);
    } catch (err: any) {
      if (err?.message?.includes("Session expired") || !isAuthenticated()) {
        clearTokens();
        router.push("/login");
      } else {
        setError(err?.message || "ไม่สามารถโหลดข้อมูลรายชื่อลูกค้าได้ กรุณาลองใหม่อีกครั้ง");
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

  // Sync with searchParams if changed from outside
  useEffect(() => {
    const p = searchParams.get("priority");
    if (p) setPriorityFilter(p);
    const k = searchParams.get("kyc");
    if (k) setKycFilter(k);
  }, [searchParams]);

  // Filter and Sort Customers
  const filteredAndSortedCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const matchesPriority = priorityFilter === "all" || c.priority_level === priorityFilter;
        const matchesKyc = kycFilter === "all" || c.kyc_status === kycFilter;
        const matchesSearch =
          !searchQuery.trim() ||
          c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.external_ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.score_short_reason && c.score_short_reason.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesPriority && matchesKyc && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "priority") {
          const scoreA = a.score_display ?? 0;
          const scoreB = b.score_display ?? 0;
          return sortOrder === "desc" ? scoreB - scoreA : scoreA - scoreB;
        }
        if (sortBy === "name") {
          return sortOrder === "desc"
            ? b.full_name.localeCompare(a.full_name, "th")
            : a.full_name.localeCompare(b.full_name, "th");
        }
        if (sortBy === "policies") {
          const polA = a.active_policies_count ?? 0;
          const polB = b.active_policies_count ?? 0;
          return sortOrder === "desc" ? polB - polA : polA - polB;
        }
        return 0;
      });
  }, [customers, priorityFilter, kycFilter, searchQuery, sortBy, sortOrder]);

  const handleSort = (field: "priority" | "name" | "policies") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handleResetFilters = () => {
    setPriorityFilter("all");
    setKycFilter("all");
    setSearchQuery("");
    setSortBy("priority");
    setSortOrder("desc");
  };

  const highCount = customers.filter((c) => c.priority_level === "high").length;
  const medCount = customers.filter((c) => c.priority_level === "medium").length;
  const lowCount = customers.filter((c) => c.priority_level === "low").length;
  const pendingKycCount = customers.filter((c) => c.kyc_status === "pending").length;

  return (
    <AppShell user={user}>
      <PageHeader
        title="รายชื่อลูกค้า (Customers)"
        description="ค้นหา จัดลำดับความสำคัญ และเข้าถึงข้อมูลเชิงลึก 360 ของลูกค้าที่คุณดูแล"
        breadcrumbs={[
          { label: "แดชบอร์ด (Dashboard)", href: "/dashboard" },
          { label: "รายชื่อลูกค้า (Customers)" },
        ]}
        primaryAction={
          <Button variant="primary" size="sm" leftIcon="🔄" onClick={loadData} isLoading={loading}>
            รีเฟรชข้อมูล
          </Button>
        }
        secondaryAction={
          <Link href="/dashboard">
            <Button variant="outline" size="sm" leftIcon="🏠">
              กลับหน้าแดชบอร์ด
            </Button>
          </Link>
        }
      />

      {error && (
        <Alert variant="danger" style={{ marginBottom: "var(--space-5)" }} action={<Button size="sm" onClick={loadData}>ลองใหม่</Button>}>
          {error}
        </Alert>
      )}

      {/* ── Search & Filters Bar ── */}
      <Card noPadding style={{ marginBottom: "var(--space-6)" }}>
        <div
          style={{
            padding: "var(--space-4) var(--space-5)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          {/* Top Row: Search input + Results summary */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "var(--space-4)",
              flexWrap: "wrap",
            }}
          >
            <div style={{ position: "relative", flex: "1 1 320px", maxWidth: "480px" }}>
              <input
                type="text"
                placeholder="ค้นหาชื่อ, รหัสอ้างอิง, หรือเหตุผลความต้องการ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  height: "38px",
                  padding: "0 36px 0 14px",
                  fontSize: "var(--fs-sm)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-surface-subtle)",
                  color: "var(--slate-800)",
                  outline: "none",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--slate-400)",
                    fontSize: "14px",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                  title="ล้างคำค้นหา"
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <span>
                แสดง <strong>{filteredAndSortedCustomers.length}</strong> จากทั้งหมด {customers.length} รายการ
              </span>
              {(priorityFilter !== "all" || kycFilter !== "all" || searchQuery) && (
                <Button variant="ghost" size="sm" onClick={handleResetFilters} style={{ color: "var(--primary-700)" }}>
                  ล้างตัวกรองทั้งหมด
                </Button>
              )}
            </div>
          </div>

          {/* Bottom Row: Quick Filter Tabs */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "var(--space-4)",
              flexWrap: "wrap",
              borderTop: "1px solid var(--border-subtle)",
              paddingTop: "var(--space-3)",
            }}
          >
            {/* Priority Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
              <span style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--slate-600)" }}>
                ระดับความสำคัญ:
              </span>
              <div style={{ display: "flex", gap: "4px", backgroundColor: "var(--slate-100)", padding: "2px", borderRadius: "var(--radius-md)" }}>
                {[
                  { id: "all", label: "ทั้งหมด", count: customers.length },
                  { id: "high", label: "สูง", count: highCount },
                  { id: "medium", label: "ปานกลาง", count: medCount },
                  { id: "low", label: "ต่ำ", count: lowCount },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setPriorityFilter(item.id)}
                    style={{
                      padding: "4px 10px",
                      fontSize: "0.75rem",
                      fontWeight: priorityFilter === item.id ? 700 : 500,
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: priorityFilter === item.id ? "var(--white)" : "transparent",
                      color: priorityFilter === item.id ? "var(--slate-900)" : "var(--slate-600)",
                      boxShadow: priorityFilter === item.id ? "var(--shadow-xs)" : "none",
                      transition: "all var(--motion-fast)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>{item.label}</span>
                    <span style={{ opacity: 0.65, fontSize: "0.6875rem" }}>({item.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* KYC Filter & Sorting */}
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
              {/* KYC status filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <span style={{ fontSize: "var(--fs-xs)", fontWeight: 600, color: "var(--slate-600)" }}>
                  สถานะ KYC:
                </span>
                <select
                  value={kycFilter}
                  onChange={(e) => setKycFilter(e.target.value)}
                  style={{
                    height: "30px",
                    fontSize: "var(--fs-xs)",
                    padding: "0 8px",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--slate-800)",
                  }}
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="verified">KYC ผ่านแล้ว</option>
                  <option value="pending">KYC รอตรวจสอบ ({pendingKycCount})</option>
                  <option value="rejected">KYC ไม่ผ่าน</option>
                </select>
              </div>

              {/* Sort by dropdown */}
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <span style={{ fontSize: "var(--fs-xs)", fontWeight: 600, color: "var(--slate-600)" }}>
                  เรียงตาม:
                </span>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [f, o] = e.target.value.split("-") as ["priority" | "name" | "policies", "asc" | "desc"];
                    setSortBy(f);
                    setSortOrder(o);
                  }}
                  style={{
                    height: "30px",
                    fontSize: "var(--fs-xs)",
                    padding: "0 8px",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--slate-800)",
                  }}
                >
                  <option value="priority-desc">คะแนน AI (สูง → ต่ำ)</option>
                  <option value="priority-asc">คะแนน AI (ต่ำ → สูง)</option>
                  <option value="name-asc">ชื่อลูกค้า (ก-ฮ / A-Z)</option>
                  <option value="name-desc">ชื่อลูกค้า (ฮ-ก / Z-A)</option>
                  <option value="policies-desc">จำนวนกรมธรรม์ (มาก → น้อย)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Customer List Table (Desktop View) & Cards (Mobile View) ── */}
      <Card noPadding>
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : filteredAndSortedCustomers.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table density="comfortable">
                <TableHeader>
                  <TableRow hover={false}>
                    <TableHeadCell
                      sortDirection={sortBy === "name" ? sortOrder : undefined}
                      onSort={() => handleSort("name")}
                    >
                      ลูกค้า
                    </TableHeadCell>
                    <TableHeadCell
                      sortDirection={sortBy === "priority" ? sortOrder : undefined}
                      onSort={() => handleSort("priority")}
                    >
                      ลำดับความสำคัญ & คะแนน AI
                    </TableHeadCell>
                    <TableHeadCell>เหตุผลที่ระบบจัดลำดับ</TableHeadCell>
                    <TableHeadCell
                      sortDirection={sortBy === "policies" ? sortOrder : undefined}
                      onSort={() => handleSort("policies")}
                    >
                      กรมธรรม์ถือครอง
                    </TableHeadCell>
                    <TableHeadCell>สถานะ KYC</TableHeadCell>
                    <TableHeadCell align="right">การดำเนินการ</TableHeadCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedCustomers.map((c) => (
                    <TableRow key={c.id}>
                      {/* Customer Name & Reference */}
                      <TableCell>
                        <div>
                          <Link
                            href={`/customers/${c.id}`}
                            style={{
                              fontWeight: 700,
                              color: "var(--primary-700)",
                              fontSize: "var(--fs-base)",
                            }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = "underline")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = "none")}
                          >
                            {c.full_name}
                          </Link>
                          <div
                            style={{
                              fontSize: "var(--fs-xs)",
                              color: "var(--slate-500)",
                              marginTop: "2px",
                              display: "flex",
                              gap: "6px",
                              alignItems: "center",
                            }}
                          >
                            <span>{c.external_ref}</span>
                            <span>•</span>
                            <span>{c.relationship_tier || "Standard Tier"}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Priority Score Component */}
                      <TableCell>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {c.priority_level ? (
                            <PriorityScore
                              score={c.score_display ? Math.round(c.score_display) : 0}
                              priority={c.priority_level}
                              compact
                            />
                          ) : (
                            <Badge variant="neutral" size="sm">ยังไม่ประเมิน</Badge>
                          )}
                          <Tooltip content="คะแนนประเมินโอกาสและความจำเป็นในการติดต่อจากโมเดล LightGBM">
                            <span style={{ fontSize: "11px", color: "var(--slate-400)", cursor: "help" }}>ℹ️</span>
                          </Tooltip>
                        </div>
                      </TableCell>

                      {/* Short Reason */}
                      <TableCell>
                        <div
                          style={{
                            fontSize: "var(--fs-sm)",
                            color: "var(--slate-700)",
                            maxWidth: "280px",
                            lineHeight: 1.4,
                          }}
                        >
                          {c.score_short_reason || "พร้อมวิเคราะห์ความต้องการเชิงลึก"}
                        </div>
                      </TableCell>

                      {/* Policies */}
                      <TableCell>
                        <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--slate-800)" }}>
                          {c.active_policies_count} ฉบับ
                        </div>
                        {c.has_overdue_followup && (
                          <div style={{ fontSize: "11px", color: "var(--danger-solid)", marginTop: "2px", fontWeight: 600 }}>
                            ⚠️ มีนัดหมายเกินกำหนด
                          </div>
                        )}
                      </TableCell>

                      {/* KYC Status */}
                      <TableCell>
                        <Status
                          variant={c.kyc_status === "verified" ? "healthy" : c.kyc_status === "pending" ? "warning" : "critical"}
                          label={c.kyc_status === "verified" ? "KYC ผ่านแล้ว" : c.kyc_status === "pending" ? "รอตรวจสอบ" : "ไม่ผ่าน"}
                          size="sm"
                        />
                      </TableCell>

                      {/* Action */}
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
            </div>

            {/* Mobile / Small Screen Card View */}
            <div className="block md:hidden" style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {filteredAndSortedCustomers.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: "var(--space-4)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--bg-surface)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-3)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <Link
                        href={`/customers/${c.id}`}
                        style={{ fontWeight: 700, fontSize: "var(--fs-md)", color: "var(--primary-700)" }}
                      >
                        {c.full_name}
                      </Link>
                      <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "2px" }}>
                        {c.external_ref} · {c.relationship_tier || "Standard Tier"}
                      </div>
                    </div>
                    {c.priority_level && (
                      <PriorityScore
                        score={c.score_display ? Math.round(c.score_display) : 0}
                        priority={c.priority_level}
                        compact
                      />
                    )}
                  </div>

                  <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-600)", lineHeight: 1.4, backgroundColor: "var(--slate-50)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
                    <strong>เหตุผล:</strong> {c.score_short_reason || "พร้อมวิเคราะห์ความต้องการ"}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "var(--space-2)" }}>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)" }}>
                      {c.active_policies_count} กรมธรรม์ · KYC: {c.kyc_status}
                    </div>
                    <Link href={`/customers/${c.id}`}>
                      <Button variant="primary" size="sm" leftIcon="📋">
                        เปิดข้อมูล
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon="🔍"
            title="ไม่พบลูกค้าที่ตรงกับเงื่อนไข"
            description="ลองเปลี่ยนคำค้นหาหรือปรับตัวกรองระดับความสำคัญ / สถานะ KYC ด้านบน"
            action={
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                ล้างตัวกรองทั้งหมด
              </Button>
            }
          />
        )}
      </Card>
    </AppShell>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} cols={5} />}>
      <CustomersContent />
    </Suspense>
  );
}
