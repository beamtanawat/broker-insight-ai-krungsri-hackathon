"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";

interface CommandItem {
  id: string;
  category: "ลูกค้า (Customers)" | "เมนูนำทาง (Navigation)" | "เครื่องมือด่วน (Quick Actions)";
  title: string;
  subtitle: string;
  icon: string;
  href: string;
  badge?: string;
  badgeColor?: string;
}

const COMMAND_ITEMS: CommandItem[] = [
  // Demo Personas & Core Customers
  {
    id: "ks-00001",
    category: "ลูกค้า (Customers)",
    title: "ณัฐพร วาริน (KS-00001)",
    subtitle: "Platinum Tier · Priority 92/100 · กรมธรรม์ใกล้ครบกำหนด 14 วัน",
    icon: "⚡",
    href: "/customers/d82e838c-63fb-47a3-9428-f15dc4d68883",
    badge: "ด่วนที่สุด",
    badgeColor: "#dc2626",
  },
  {
    id: "ks-00004",
    category: "ลูกค้า (Customers)",
    title: "วิภา ชัยโย (KS-00004)",
    subtitle: "Gold Tier · สินเชื่อบ้าน 5.5 ล้านบาท ไร้ประกันคุ้มครองวงเงิน (MRTA)",
    icon: "🛡️",
    href: "/customers/c0a451ce-a2b5-406e-9358-4a2af87721ca",
    badge: "Protection Gap",
    badgeColor: "#d97706",
  },
  {
    id: "ks-00005",
    category: "ลูกค้า (Customers)",
    title: "ธนภูมิ ยิ้มแย้ม (KS-00005)",
    subtitle: "Platinum Tier · วัยใกล้เกษียณอายุ 52 ปี · แนะนำ Krungsri Smart Pension",
    icon: "💰",
    href: "/customers/f535562e-8f70-4711-bbd0-7e092606cdd7",
    badge: "วางแผนบำนาญ",
    badgeColor: "#2563eb",
  },
  {
    id: "ks-00006",
    category: "ลูกค้า (Customers)",
    title: "วิภา รุ่งเรือง (KS-00006)",
    subtitle: "Standard Tier · รอยืนยันตัวตน KYC · บัญชีเงินฝากพร้อมต่อยอด",
    icon: "⏳",
    href: "/customers/0dd17657-a534-4f57-836c-26d73cc0c2e5",
    badge: "KYC Pending",
    badgeColor: "#7c3aed",
  },
  {
    id: "ks-00002",
    category: "ลูกค้า (Customers)",
    title: "สมชาย วัฒนา (KS-00002)",
    subtitle: "Gold Tier · ครบกำหนดต่ออายุใน 65 วัน · AI Score 58/100",
    icon: "👤",
    href: "/customers/KS-00002",
    badge: "ต่ออายุรอบ 2 เดือน",
    badgeColor: "#d97706",
  },
  {
    id: "ks-00003",
    category: "ลูกค้า (Customers)",
    title: "สมศักดิ์ ใจดี (KS-00003)",
    subtitle: "Standard Tier · กรมธรรม์เหลือ 280 วัน · วางแผนความคุ้มครองสุขภาพ",
    icon: "👤",
    href: "/customers/KS-00003",
    badge: "ดูแลสัมพันธ์",
    badgeColor: "#16a34a",
  },

  // Navigation Items
  {
    id: "nav-dashboard",
    category: "เมนูนำทาง (Navigation)",
    title: "แดชบอร์ดการทำงานนายหน้า (Broker Workspace)",
    subtitle: "สรุปภาพรวมประจำวัน ลูกค้าเร่งด่วน และงานติดตามผล",
    icon: "🏠",
    href: "/dashboard",
  },
  {
    id: "nav-customers",
    category: "เมนูนำทาง (Navigation)",
    title: "รายชื่อลูกค้าทั้งหมด (Customer Directory)",
    subtitle: "ค้นหา คัดกรองตามระดับความสำคัญ และสถานะ KYC",
    icon: "👥",
    href: "/customers",
  },
  {
    id: "nav-model",
    category: "เมนูนำทาง (Navigation)",
    title: "สุขภาพระบบ AI และความโปร่งใส (AI Health & Explainability)",
    subtitle: "AUC 0.89, SHAP Feature Importance, Benchmark & Governance",
    icon: "🤖",
    href: "/model",
  },
  {
    id: "nav-analytics",
    category: "เมนูนำทาง (Navigation)",
    title: "ภาพรวมธุรกิจและผลการดำเนินงาน (Business Analytics)",
    subtitle: "อัตราการตอบรับข้อเสนอ (Approval Rate) และความครอบคลุมพอร์ต",
    icon: "📈",
    href: "/analytics",
  },
  {
    id: "nav-pilot",
    category: "เมนูนำทาง (Navigation)",
    title: "การประเมินการทดสอบนำร่อง (Pilot Sandbox Evaluation)",
    subtitle: "8 สถานการณ์จำลอง, จับเวลาการทำงาน และแบบสอบถามนายหน้า",
    icon: "🧪",
    href: "/pilot",
  },
  {
    id: "nav-audit",
    category: "เมนูนำทาง (Navigation)",
    title: "บันทึกการตรวจสอบระบบ (System Audit Log)",
    subtitle: "ประวัติการประเมิน AI และการตัดสินใจของนายหน้า (Compliance Trail)",
    icon: "📜",
    href: "/admin/audit",
  },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!query.trim()) return COMMAND_ITEMS;
    const q = query.toLowerCase();
    return COMMAND_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.badge?.toLowerCase().includes(q)
    );
  }, [query]);

  // Reset selection index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation & Shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Toggle palette on Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }

      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (filteredItems.length || 1)) % (filteredItems.length || 1));
      } else if (e.key === "Enter" && filteredItems.length > 0) {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected) {
          router.push(selected.href);
          onClose();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, filteredItems, selectedIndex, router]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        backgroundColor: "rgba(11, 30, 54, 0.65)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "80px 16px 20px",
        animation: "fadeIn 0.15s ease-out",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "640px",
          backgroundColor: "#ffffff",
          borderRadius: "var(--radius-xl)",
          boxShadow: "0 25px 60px -15px rgba(11, 30, 54, 0.4), 0 0 0 1px rgba(254, 203, 0, 0.3)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "75vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gold Accent Bar */}
        <div style={{ height: "4px", background: "var(--krungsri-gold-gradient)" }} />

        {/* Search Input Bar */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            backgroundColor: "#ffffff",
          }}
        >
          <span style={{ fontSize: "18px", color: "var(--slate-400)" }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="ค้นหาลูกค้า (เช่น ณัฐพร, KS-00001) หรือเมนูระบบ..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              fontSize: "15px",
              fontWeight: 500,
              color: "var(--krungsri-navy)",
              backgroundColor: "transparent",
            }}
          />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--slate-400)",
              backgroundColor: "var(--slate-100)",
              padding: "3px 7px",
              borderRadius: "4px",
              border: "1px solid var(--border-subtle)",
              letterSpacing: "0.03em",
            }}
          >
            ESC
          </span>
        </div>

        {/* Results List */}
        <div style={{ overflowY: "auto", padding: "8px", display: "flex", flexDirection: "column", gap: "2px" }}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    router.push(item.href);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "var(--radius-lg)",
                    backgroundColor: isSelected ? "rgba(254, 203, 0, 0.12)" : "transparent",
                    border: `1.5px solid ${isSelected ? "var(--krungsri-yellow)" : "transparent"}`,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    transition: "all var(--motion-fast) ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: isSelected ? "#ffffff" : "var(--slate-100)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                        flexShrink: 0,
                        boxShadow: isSelected ? "0 2px 5px rgba(0,0,0,0.06)" : "none",
                      }}
                    >
                      {item.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--slate-900)" }}>
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--slate-500)",
                          marginTop: "2px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    {item.badge && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          color: item.badgeColor || "var(--krungsri-navy)",
                          backgroundColor: `${item.badgeColor || "#0b1e36"}14`,
                          padding: "2px 7px",
                          borderRadius: "var(--radius-full)",
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                    <span style={{ fontSize: "12px", color: isSelected ? "var(--krungsri-navy)" : "var(--slate-300)" }}>
                      ↵
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--slate-400)", fontSize: "13px" }}>
              ไม่พบผลลัพธ์ที่ตรงกับ "{query}"
            </div>
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div
          style={{
            padding: "10px 16px",
            backgroundColor: "var(--slate-50)",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "11px",
            color: "var(--slate-500)",
          }}
        >
          <div style={{ display: "flex", gap: "12px" }}>
            <span>↑↓ เพื่อเลือก</span>
            <span>↵ เพื่อเปิดหน้า</span>
            <span>ESC เพื่อปิด</span>
          </div>
          <div style={{ fontWeight: 700, color: "var(--krungsri-navy)" }}>
            ⚡ Broker Insight AI Command Palette
          </div>
        </div>
      </div>
    </div>
  );
}
