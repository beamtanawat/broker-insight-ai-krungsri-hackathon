"use client";
import React, { useState } from "react";
import type { CustomerDetail, FollowUpSummary } from "@/types";
import { Card, Badge, Button, Modal, Status, useToast } from "@/components/ui";

interface CustomerTasksProps {
  customer: CustomerDetail;
  followUps: FollowUpSummary[];
  loading: boolean;
  onCreateFollowup: (scheduledDate: string, notes: string, priority: "high" | "medium" | "low") => Promise<void>;
  onUpdateFollowup?: (followupId: string, data: { status?: string; notes?: string }) => Promise<void>;
  creating: boolean;
}

export function CustomerTasks({
  customer,
  followUps,
  onCreateFollowup,
  onUpdateFollowup,
  creating,
}: CustomerTasksProps) {
  const toast = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [taskNotice, setTaskNotice] = useState<{ message: string; variant: "success" | "info" } | null>(null);

  const openTasks = followUps.filter((f) => f.status === "open");
  const completedTasks = followUps.filter((f) => f.status === "done");

  const handleCreate = async () => {
    try {
      await onCreateFollowup(scheduledDate, notes, priority);
      setShowCreateModal(false);
      setScheduledDate("");
      setNotes("");
      toast.success("สร้างนัดหมายและบันทึกงานติดตามใหม่เรียบร้อยแล้ว", "บันทึกงานติดตาม");
      setTaskNotice({
        message: "สร้างนัดหมายและบันทึกงานติดตามใหม่เรียบร้อยแล้ว",
        variant: "success",
      });
      setTimeout(() => setTaskNotice(null), 4000);
    } catch (err: any) {
      toast.error(err?.message || "ไม่สามารถสร้างงานติดตามได้", "เกิดข้อผิดพลาด");
    }
  };

  const handleToggleStatus = async (task: FollowUpSummary, newStatus: "done" | "open") => {
    if (!onUpdateFollowup) return;
    setUpdatingTaskId(task.id);
    try {
      await onUpdateFollowup(task.id, { status: newStatus });
      const msg = newStatus === "done"
        ? `บันทึกงาน '${task.follow_up_window || "นัดหมาย"}' เป็นเสร็จสิ้นแล้ว`
        : `ย้อนกลับงาน '${task.follow_up_window || "นัดหมาย"}' เป็นรอดำเนินการ`;
      toast.success(msg, "สถานะงานติดตาม");
      setTaskNotice({
        message: msg,
        variant: newStatus === "done" ? "success" : "info",
      });
      setTimeout(() => setTaskNotice(null), 4000);
    } catch (err: any) {
      toast.error(err?.message || "ไม่สามารถอัปเดตสถานะงานได้", "เกิดข้อผิดพลาด");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleQuickPreset = (presetType: "renewal" | "docs" | "health") => {
    const today = new Date();
    if (presetType === "renewal") {
      const d = new Date(today);
      d.setDate(d.getDate() + 3);
      setScheduledDate(d.toISOString().split("T")[0]);
      setNotes(`โทรนำเสนอแผนความคุ้มครองและสรุปข้อเสนอผลิตภัณฑ์ที่แนะนำสำหรับ ${customer.full_name}`);
      setPriority("high");
    } else if (presetType === "docs") {
      const d = new Date(today);
      d.setDate(d.getDate() + 7);
      setScheduledDate(d.toISOString().split("T")[0]);
      setNotes(`ติดตามเอกสารประกอบคำขอเอาประกัน และเอกสารยืนยันรายได้/ภาษีกับ ${customer.full_name}`);
      setPriority("medium");
    } else {
      const d = new Date(today);
      d.setDate(d.getDate() + 14);
      setScheduledDate(d.toISOString().split("T")[0]);
      setNotes(`นัดหมายตรวจสุขภาพ / ตรวจสอบสิทธิประโยชน์โรงพยาบาลคู่สัญญาสำหรับ ${customer.full_name}`);
      setPriority("medium");
    }
    setShowCreateModal(true);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Header action bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "var(--fs-md)", fontWeight: 700, color: "var(--slate-900)" }}>
            รายการนัดหมายและงานติดตาม (Follow-up Tasks)
          </h3>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)", marginTop: "2px" }}>
            จัดการกำหนดการติดต่อลูกค้าและบันทึกประเด็นสำคัญจากการติดตาม
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Button
            variant="primary"
            size="sm"
            leftIcon="➕"
            onClick={() => {
              setScheduledDate("");
              setNotes("");
              setPriority("medium");
              setShowCreateModal(true);
            }}
          >
            เพิ่มงานติดตามใหม่
          </Button>
        </div>
      </div>

      {/* ── Quick Templates Bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 16px",
          backgroundColor: "var(--primary-50)",
          border: "1px dashed var(--primary-500)",
          borderRadius: "var(--radius-md)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--primary-900)", display: "flex", alignItems: "center", gap: "6px" }}>
          <span>⚡ เทมเพลตนัดหมายด่วน:</span>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => handleQuickPreset("renewal")}
            style={{
              padding: "4px 10px",
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: "var(--white)",
              color: "var(--primary-700)",
              border: "1px solid var(--primary-500)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
            }}
          >
            🎯 นัดเสนอแผนความคุ้มครอง (+3 วัน)
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset("docs")}
            style={{
              padding: "4px 10px",
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: "var(--white)",
              color: "var(--slate-700)",
              border: "1px solid var(--slate-300)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
            }}
          >
            📄 นัดตามเอกสารใบคำขอ (+7 วัน)
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset("health")}
            style={{
              padding: "4px 10px",
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: "var(--white)",
              color: "var(--slate-700)",
              border: "1px solid var(--slate-300)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
            }}
          >
            🏥 นัดตรวจสุขภาพ / ยืนยันสิทธิ์ (+14 วัน)
          </button>
        </div>
      </div>

      {/* Inline Notification Banner */}
      {taskNotice && (
        <div
          style={{
            padding: "10px 14px",
            backgroundColor: taskNotice.variant === "success" ? "var(--success-bg)" : "var(--info-bg)",
            color: taskNotice.variant === "success" ? "var(--success-text)" : "var(--info-text)",
            border: `1px solid ${taskNotice.variant === "success" ? "var(--success-border)" : "var(--info-border)"}`,
            borderRadius: "var(--radius-md)",
            fontSize: "var(--fs-xs)",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>✓ {taskNotice.message}</span>
          <button
            type="button"
            onClick={() => setTaskNotice(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

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
                <div style={{ flex: 1, minWidth: "260px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 700, fontSize: "var(--fs-base)", color: "var(--slate-900)" }}>
                      {task.follow_up_window || "นัดหมายติดต่อลูกค้า"}
                    </span>
                    <Badge variant={task.priority === "high" ? "high" : "neutral"} size="sm">
                      {task.priority === "high" ? "ด่วน" : "ปกติ"}
                    </Badge>
                    {task.payment_status === "overdue" && (
                      <span style={{ fontSize: "12px", color: "#b91c1c", fontWeight: 700 }}>
                        ⚠️ เกินกำหนดแล้ว
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-600)", marginTop: "6px", lineHeight: 1.4 }}>
                    {task.notes || "ไม่มีบันทึกเพิ่มเติม"}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--slate-400)", marginTop: "4px" }}>
                    กำหนดการ: <strong>{task.scheduled_date || "เร็ว ๆ นี้"}</strong> · ติดต่อล่าสุด: {task.last_contact_date || "-"}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Status
                    variant={task.payment_status === "overdue" ? "critical" : "warning"}
                    label={task.payment_status === "overdue" ? "เกินกำหนด" : "รอติดตาม"}
                    size="sm"
                  />
                  {onUpdateFollowup && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon="✓"
                      isLoading={updatingTaskId === task.id}
                      onClick={() => handleToggleStatus(task, "done")}
                      style={{
                        borderColor: "var(--success-solid)",
                        color: "var(--success-solid)",
                        fontWeight: 700,
                      }}
                    >
                      ทำเสร็จสิ้น
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--slate-500)", fontSize: "var(--fs-sm)" }}>
            ไม่มีงานติดตามที่ค้างอยู่ — สามารถกดปุ่ม 'เพิ่มงานติดตามใหม่' หรือใช้เทมเพลตนัดหมายด่วนด้านบน
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
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div>
                  <strong>{task.follow_up_window || "นัดหมายเสร็จสิ้น"}:</strong> {task.notes || "ดำเนินการเรียบร้อย"}
                  <div style={{ fontSize: "12px", color: "var(--slate-400)", marginTop: "2px" }}>
                    กำหนดการเดิม: {task.scheduled_date || "-"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Badge variant="success" size="sm">เสร็จสิ้น</Badge>
                  {onUpdateFollowup && (
                    <button
                      type="button"
                      disabled={updatingTaskId === task.id}
                      onClick={() => handleToggleStatus(task, "open")}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "12px",
                        color: "var(--primary-700)",
                        textDecoration: "underline",
                        cursor: "pointer",
                      }}
                    >
                      {updatingTaskId === task.id ? "กำลังปรับปรุง..." : "↺ เรียกคืน"}
                    </button>
                  )}
                </div>
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
