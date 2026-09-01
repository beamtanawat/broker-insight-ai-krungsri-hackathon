"use client";
import React, { useState } from "react";
import type { CustomerDetail, FollowUpSummary } from "@/types";
import { Card, Badge, Button, Modal, Status } from "@/components/ui";

interface CustomerTasksProps {
  customer: CustomerDetail;
  followUps: FollowUpSummary[];
  loading: boolean;
  onCreateFollowup: (scheduledDate: string, notes: string, priority: "high" | "medium" | "low") => Promise<void>;
  creating: boolean;
}

export function CustomerTasks({
  followUps,
  onCreateFollowup,
  creating,
}: CustomerTasksProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");

  const openTasks = followUps.filter((f) => f.status === "open");
  const completedTasks = followUps.filter((f) => f.status === "done");

  const handleCreate = async () => {
    await onCreateFollowup(scheduledDate, notes, priority);
    setShowCreateModal(false);
    setScheduledDate("");
    setNotes("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Header action bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "var(--fs-md)", fontWeight: 700, color: "var(--slate-900)" }}>
            รายการนัดหมายและงานติดตาม (Follow-up Tasks)
          </h3>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "2px" }}>
            จัดการกำหนดการติดต่อลูกค้าและบันทึกประเด็นสำคัญจากการติดตาม
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon="➕"
          onClick={() => setShowCreateModal(true)}
        >
          เพิ่มงานติดตามใหม่
        </Button>
      </div>

      {/* ── Active Tasks List ── */}
      <Card
        title={`📌 งานที่รอดำเนินการ (${openTasks.length} รายการ)`}
        subtitle="นัดหมายที่ต้องติดต่อหรือติดตามผลกับลูกค้า"
      >
        {openTasks.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {openTasks.map((task) => (
              <div
                key={task.id}
                style={{
                  padding: "16px",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: task.payment_status === "overdue" ? "#fef2f2" : "var(--bg-surface)",
                  borderLeft: `4px solid ${task.payment_status === "overdue" ? "#dc2626" : "var(--primary-600)"}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 700, fontSize: "var(--fs-sm)", color: "var(--slate-900)" }}>
                      {task.follow_up_window || "นัดหมายติดต่อลูกค้า"}
                    </span>
                    <Badge variant={task.priority === "high" ? "high" : "neutral"} size="sm">
                      {task.priority === "high" ? "ด่วน" : "ปกติ"}
                    </Badge>
                    {task.payment_status === "overdue" && (
                      <span style={{ fontSize: "11px", color: "#b91c1c", fontWeight: 700 }}>
                        ⚠️ เกินกำหนดแล้ว
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-600)", marginTop: "6px", lineHeight: 1.4 }}>
                    {task.notes || "ไม่มีบันทึกเพิ่มเติม"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--slate-400)", marginTop: "4px" }}>
                    กำหนดการ: <strong>{task.scheduled_date || "เร็ว ๆ นี้"}</strong> · ติดต่อล่าสุด: {task.last_contact_date || "-"}
                  </div>
                </div>

                <div>
                  <Status
                    variant={task.payment_status === "overdue" ? "critical" : "warning"}
                    label={task.payment_status === "overdue" ? "เกินกำหนด" : "รอติดตาม"}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--slate-500)", fontSize: "var(--fs-sm)" }}>
            ไม่มีงานติดตามที่ค้างอยู่ — สามารถกดปุ่ม 'เพิ่มงานติดตามใหม่' เพื่อสร้างนัดหมาย
          </div>
        )}
      </Card>

      {/* ── Completed Tasks List ── */}
      {completedTasks.length > 0 && (
        <Card
          title={`✓ ประวัติงานที่เสร็จสิ้นแล้ว (${completedTasks.length} รายการ)`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {completedTasks.map((task) => (
              <div
                key={task.id}
                style={{
                  padding: "12px 14px",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--slate-50)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "var(--fs-xs)",
                  color: "var(--slate-600)",
                }}
              >
                <div>
                  <strong>{task.follow_up_window || "นัดหมายเสร็จสิ้น"}:</strong> {task.notes || "ดำเนินการเรียบร้อย"}
                </div>
                <Badge variant="success" size="sm">เสร็จสิ้น</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Create Follow-up Modal ── */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="สร้างนัดหมาย / งานติดตามใหม่"
          subtitle="บันทึกกำหนดการติดต่อหรือทบทวนความคุ้มครองกับลูกค้า"
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                ยกเลิก
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreate}
                isLoading={creating}
                disabled={!notes.trim()}
              >
                บันทึกงานติดตาม
              </Button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div>
              <label style={{ display: "block", fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--slate-700)", marginBottom: "6px" }}>
                วันที่นัดหมาย (Scheduled Date):
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                style={{
                  width: "100%",
                  height: "36px",
                  fontSize: "var(--fs-sm)",
                  padding: "0 10px",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--slate-700)", marginBottom: "6px" }}>
                ระดับความสำคัญ (Priority):
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                style={{
                  width: "100%",
                  height: "36px",
                  fontSize: "var(--fs-sm)",
                  padding: "0 10px",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <option value="high">ด่วนมาก (High)</option>
                <option value="medium">ปกติ (Medium)</option>
                <option value="low">ต่ำ (Low)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--slate-700)", marginBottom: "6px" }}>
                บันทึกรายละเอียดงาน / สิ่งที่ต้องติดตาม:
              </label>
              <textarea
                rows={3}
                placeholder="เช่น โทรนำเสนอแผนประกันสุขภาพปลดล็อค หรือ ติดตามผลการตรวจสุขภาพ..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "var(--fs-sm)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  resize: "vertical",
                }}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
