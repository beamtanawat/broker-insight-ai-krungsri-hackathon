"use client";
import React, { useState } from "react";
import Link from "next/link";
import type { FollowUp } from "@/types";

export interface TaskItem {
  id: string;
  time: string;
  taskType: string;
  taskIcon: string;
  description: string;
  customerName: string;
  customerRef: string;
  customerId: string;
  status: "pending" | "in_progress" | "completed";
  statusLabel: string;
  actionLabel: string;
  actionIcon: string;
}

const DEFAULT_TODAY_TASKS: TaskItem[] = [
  {
    id: "t-1",
    time: "09:00",
    taskType: "โทรติดตาม",
    taskIcon: "📞",
    description: "ติดตามการต่ออายุกรมธรรม์รถยนต์",
    customerName: "ณัฐชา 'เพิร์ล' ประเสริฐกิจการ",
    customerRef: "KS-00002",
    customerId: "c0c0f992-b06d-4b9f-bbc6-9b4458a79491",
    status: "pending",
    statusLabel: "รอดำเนินการ",
    actionLabel: "โทรเลย",
    actionIcon: "📞",
  },
  {
    id: "t-2",
    time: "10:30",
    taskType: "ตรวจสอบ KYC",
    taskIcon: "📄",
    description: "ตรวจสอบเอกสาร KYC เพิ่มเติม",
    customerName: "ณัฐพร วาริน",
    customerRef: "KS-00001",
    customerId: "d82e838c-63fb-47a3-9428-f15dc4d68883",
    status: "pending",
    statusLabel: "รอดำเนินการ",
    actionLabel: "ตรวจสอบ",
    actionIcon: "📄",
  },
  {
    id: "t-3",
    time: "13:00",
    taskType: "นัดหมายลูกค้า",
    taskIcon: "📅",
    description: "พบลูกค้าเพื่อเสนอแผนประกันสุขภาพ",
    customerName: "วิภา ชัยโย",
    customerRef: "KS-00004",
    customerId: "c0a451ce-a2b5-406e-9358-4a2af87721ca",
    status: "pending",
    statusLabel: "รอดำเนินการ",
    actionLabel: "ดูรายละเอียด",
    actionIcon: "📅",
  },
  {
    id: "t-4",
    time: "15:30",
    taskType: "ต่ออายุกรมธรรม์",
    taskIcon: "📄",
    description: "ติดตามการต่ออายุประกันชีวิต",
    customerName: "ธนภูมิ ยิ้มแย้ม",
    customerRef: "KS-00005",
    customerId: "f535562e-8f70-4711-bbd0-7e092606cdd7",
    status: "in_progress",
    statusLabel: "กำลังดำเนินการ",
    actionLabel: "อัปเดต",
    actionIcon: "📝",
  },
];

interface TodayTasksTableProps {
  followups?: FollowUp[];
  totalTasksCount?: number;
}

export function TodayTasksTable({
  followups,
  totalTasksCount = 14,
}: TodayTasksTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const tasks = React.useMemo(() => {
    if (!followups || followups.length === 0) return DEFAULT_TODAY_TASKS;
    return DEFAULT_TODAY_TASKS;
  }, [followups]);

  const toggleSelectAll = () => {
    if (selectedIds.length === tasks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tasks.map((t) => t.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "14px",
        border: "1px solid #E2E8F0",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        overflow: "hidden",
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #F1F5F9",
        }}
      >
        <h2
          style={{
            fontSize: "1.0625rem",
            fontWeight: 800,
            color: "#0F172A",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          งานที่ต้องทำวันนี้ ({totalTasksCount} รายการ)
        </h2>
        <Link
          href="/dashboard#tasks"
          style={{
            fontSize: "0.8125rem",
            fontWeight: 700,
            color: "#5a4544",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span>ดูทั้งหมด</span>
          <span>›</span>
        </Link>
      </div>

      {/* Table Area */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            fontSize: "0.8125rem",
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: "#F8FAFC",
                borderBottom: "1px solid #E2E8F0",
                color: "#64748B",
                fontWeight: 700,
                fontSize: "0.75rem",
              }}
            >
              <th style={{ padding: "12px 16px", width: "40px", textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={selectedIds.length === tasks.length}
                  onChange={toggleSelectAll}
                  aria-label="เลือกงานทั้งหมด"
                  style={{ cursor: "pointer", accentColor: "#5a4544" }}
                />
              </th>
              <th style={{ padding: "12px 14px", width: "90px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                  <span>เวลา</span>
                  <span style={{ fontSize: "0.75rem" }}>⌄</span>
                </div>
              </th>
              <th style={{ padding: "12px 14px", width: "130px" }}>ประเภทงาน</th>
              <th style={{ padding: "12px 14px" }}>รายละเอียด</th>
              <th style={{ padding: "12px 14px", width: "200px" }}>ลูกค้า</th>
              <th style={{ padding: "12px 14px", width: "120px" }}>สถานะ</th>
              <th style={{ padding: "12px 16px", width: "160px", textAlign: "right" }}>การดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, idx) => {
              const isSelected = selectedIds.includes(task.id);
              const isPending = task.status === "pending";

              return (
                <tr
                  key={task.id}
                  style={{
                    borderBottom: idx === tasks.length - 1 ? "none" : "1px solid #F1F5F9",
                    backgroundColor: isSelected ? "#F8FAFC" : "#ffffff",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = "#F8FAFC";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = "#ffffff";
                  }}
                >
                  {/* Checkbox */}
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectRow(task.id)}
                      aria-label={`เลือก ${task.taskType} - ${task.customerName}`}
                      style={{ cursor: "pointer", accentColor: "#5a4544" }}
                    />
                  </td>

                  {/* Time */}
                  <td style={{ padding: "14px", fontWeight: 700, color: "#1E293B", whiteSpace: "nowrap" }}>
                    {task.time}
                  </td>

                  {/* Task Type */}
                  <td style={{ padding: "14px", whiteSpace: "nowrap" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#334155",
                      }}
                    >
                      <span>{task.taskIcon}</span>
                      <span>{task.taskType}</span>
                    </span>
                  </td>

                  {/* Description */}
                  <td
                    style={{
                      padding: "14px",
                      color: "#475569",
                      fontWeight: 500,
                      fontFamily: "var(--font-reading-thai)",
                      lineHeight: "var(--lh-reading, 1.7)",
                    }}
                  >
                    {task.description}
                  </td>

                  {/* Customer */}
                  <td style={{ padding: "14px" }}>
                    <Link
                      href={`/customers/${task.customerId}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          color: "#0F172A",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {task.customerName}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "2px" }}>
                        {task.customerRef}
                      </div>
                    </Link>
                  </td>

                  {/* Status Badge */}
                  <td style={{ padding: "14px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "4px",
                        backgroundColor: isPending ? "#FEF2F2" : "#FAF7F6",
                        color: isPending ? "#DC2626" : "#5a4544",
                        border: `1px solid ${isPending ? "#FECACA" : "#E2DAD9"}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {task.statusLabel}
                    </span>
                  </td>

                  {/* Action Button */}
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <button
                        type="button"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          backgroundColor: "#FAF7F6",
                          border: "1px solid #E2DAD9",
                          color: "#5a4544",
                          borderRadius: "6px",
                          padding: "5px 10px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "background-color 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F1ECEB")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FAF7F6")}
                      >
                        <span>{task.actionIcon}</span>
                        <span>{task.actionLabel}</span>
                      </button>

                      <button
                        type="button"
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          border: "1px solid #E2E8F0",
                          backgroundColor: "#ffffff",
                          color: "#64748B",
                          fontSize: "0.875rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="ตัวเลือกเพิ่มเติม"
                      >
                        ...
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
