"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import type { AuditLog, User } from "@/types";
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
  Drawer,
} from "@/components/ui";
import { PageHeader } from "@/components/domain";

export default function AuditPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    api.auth.me().then(setUser).catch(() => null);
    setLoading(true);
    api.audit
      .list(page)
      .then((data) => {
        setLogs(data.items);
        setTotalLogs(data.total);
      })
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false));
  }, [page, router]);

  const getActionBadgeVariant = (action: string): "success" | "warning" | "danger" | "info" | "neutral" => {
    if (action.includes("approve") || action.includes("login") || action.includes("success")) return "success";
    if (action.includes("modify") || action.includes("update") || action.includes("pilot")) return "warning";
    if (action.includes("reject") || action.includes("delete") || action.includes("fail")) return "danger";
    if (action.includes("score") || action.includes("analyze") || action.includes("ai")) return "info";
    return "neutral";
  };

  return (
    <AppShell user={user}>
      {/* ── 1. Page Header ── */}
      <PageHeader
        title="บันทึกการตรวจสอบระบบ (Enterprise Audit Trail)"
        description="ตรวจสอบและติดตามทุกกิจกรรมการเข้าถึงข้อมูล การประมวลผล AI และการตัดสินใจของนายหน้าตามมาตรฐานการกำกับดูแล"
        breadcrumbs={[
          { label: "การกำกับดูแล (Administration)" },
          { label: "บันทึกระบบ (System Audit)" },
        ]}
        secondaryAction={
          <Link href="/dashboard">
            <Button variant="outline" size="sm" leftIcon="🏠">
              แดชบอร์ด
            </Button>
          </Link>
        }
      />

      {/* ── 2. Audit Trail Table Card ── */}
      <Card noPadding>
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : logs.length > 0 ? (
          <>
            <Table density="compact">
              <TableHeader>
                <TableRow hover={false}>
                  <TableHeadCell>วันเวลา (Timestamp)</TableHeadCell>
                  <TableHeadCell>ผู้ดำเนินการ (Actor ID)</TableHeadCell>
                  <TableHeadCell>ประเภทกิจกรรม (Action)</TableHeadCell>
                  <TableHeadCell>เป้าหมาย (Entity Type)</TableHeadCell>
                  <TableHeadCell>รหัสอ้างอิง (Entity ID)</TableHeadCell>
                  <TableHeadCell align="right">การดำเนินการ</TableHeadCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", whiteSpace: "nowrap" }}>
                      {new Date(l.timestamp).toLocaleString("th-TH")}
                    </TableCell>
                    <TableCell style={{ fontFamily: "monospace", fontSize: "var(--fs-xs)" }}>
                      {l.user_id ? l.user_id.slice(0, 8) + "..." : "System Service"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(l.action)} size="sm">
                        {l.action}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: "var(--fs-xs)", fontWeight: 600 }}>
                      {l.entity_type || "—"}
                    </TableCell>
                    <TableCell style={{ fontFamily: "monospace", fontSize: "var(--fs-xs)", color: "var(--slate-500)" }}>
                      {l.entity_id ? l.entity_id.slice(0, 12) + "..." : "—"}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(l)}
                        style={{ color: "var(--primary-700)" }}
                      >
                        ดูรายละเอียด
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "var(--space-3) var(--space-5)",
                borderTop: "1px solid var(--border-subtle)",
                fontSize: "var(--fs-xs)",
                color: "var(--slate-500)",
              }}
            >
              <div>
                แสดงหน้า {page} (รวม {totalLogs} รายการ)
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  ← หน้าก่อน
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={logs.length < 20}
                >
                  หน้าถัดไป →
                </Button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            icon="📜"
            title="ไม่พบบันทึกกิจกรรมการตรวจสอบ"
            description="ยังไม่มีประวัติกิจกรรมที่บันทึกในหน้านี้"
          />
        )}
      </Card>

      {/* ── Event Inspection Drawer ── */}
      {selectedLog && (
        <Drawer
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title={`รายละเอียดกิจกรรม: ${selectedLog.action}`}
          subtitle={`รหัสบันทึก: ${selectedLog.id}`}
          width="540px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <table style={{ width: "100%", fontSize: "var(--fs-sm)", borderCollapse: "collapse" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "8px 0", color: "var(--slate-500)" }}>วันเวลา (Timestamp)</td>
                  <td style={{ padding: "8px 0", fontWeight: 600 }}>{new Date(selectedLog.timestamp).toLocaleString("th-TH")}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "8px 0", color: "var(--slate-500)" }}>ผู้ดำเนินการ (Actor ID)</td>
                  <td style={{ padding: "8px 0", fontFamily: "monospace" }}>{selectedLog.user_id || "System"}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "8px 0", color: "var(--slate-500)" }}>ประเภทกิจกรรม (Action)</td>
                  <td style={{ padding: "8px 0" }}>
                    <Badge variant={getActionBadgeVariant(selectedLog.action)} size="sm">
                      {selectedLog.action}
                    </Badge>
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "8px 0", color: "var(--slate-500)" }}>เป้าหมาย (Entity Type)</td>
                  <td style={{ padding: "8px 0", fontWeight: 600 }}>{selectedLog.entity_type || "—"}</td>
                </tr>
                <tr>
                  <td style={{ padding: "8px 0", color: "var(--slate-500)" }}>รหัสเป้าหมาย (Entity ID)</td>
                  <td style={{ padding: "8px 0", fontFamily: "monospace" }}>{selectedLog.entity_id || "—"}</td>
                </tr>
              </tbody>
            </table>

            {/* Metadata Payload */}
            <div>
              <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--slate-700)", marginBottom: "6px" }}>
                ข้อมูล Payload (Audit Metadata):
              </div>
              <pre
                style={{
                  padding: "12px",
                  backgroundColor: "var(--slate-900)",
                  color: "var(--slate-100)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "11px",
                  overflowX: "auto",
                  lineHeight: 1.5,
                }}
              >
                {JSON.stringify(selectedLog.metadata || {}, null, 2)}
              </pre>
            </div>

            <div style={{ marginTop: "var(--space-2)" }}>
              <Button variant="outline" size="md" style={{ width: "100%" }} onClick={() => setSelectedLog(null)}>
                ปิดหน้าต่าง
              </Button>
            </div>
          </div>
        </Drawer>
      )}
    </AppShell>
  );
}
