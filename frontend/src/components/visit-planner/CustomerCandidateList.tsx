"use client";
import React, { useState, useMemo } from "react";
import type { CandidateCustomerOut } from "@/types";
import { Badge, Button, Tooltip } from "@/components/ui";

interface CustomerCandidateListProps {
  candidates: CandidateCustomerOut[];
  selectedIds: Set<string>;
  onToggleCustomer: (customerId: string) => void;
  onSelectAllRoutable: () => void;
  onSelectHighPriority: () => void;
  onClearSelection: () => void;
  loading?: boolean;
}

export function CustomerCandidateList({
  candidates,
  selectedIds,
  onToggleCustomer,
  onSelectAllRoutable,
  onSelectHighPriority,
  onClearSelection,
  loading = false,
}: CustomerCandidateListProps) {
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<"all" | "routable_only">("all");

  // Filtered list
  const filteredCandidates = useMemo(() => {
    return candidates.filter((item) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = item.customer_name.toLowerCase().includes(q);
        const matchRef = item.external_ref.toLowerCase().includes(q);
        const matchDistrict = item.district?.toLowerCase().includes(q) || false;
        const matchWhyNow = item.why_now?.toLowerCase().includes(q) || false;
        if (!matchName && !matchRef && !matchDistrict && !matchWhyNow) {
          return false;
        }
      }

      // Priority
      if (priorityFilter !== "all" && item.priority_level !== priorityFilter) {
        return false;
      }

      // Location
      if (locationFilter === "routable_only" && !item.routable) {
        return false;
      }

      return true;
    });
  }, [candidates, search, priorityFilter, locationFilter]);

  const routableCount = candidates.filter((c) => c.routable).length;
  const unroutableCount = candidates.length - routableCount;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header & Controls */}
      <div style={{ paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.1rem" }}>👥</span>
              <h3 style={{ margin: 0, fontSize: "1.0rem", fontWeight: 700, color: "var(--krungsri-navy)" }}>
                รายชื่อลูกค้าเป้าหมาย (Eligible Candidates)
              </h3>
              <Badge variant="ai" size="sm">
                เลือกแล้ว {selectedIds.size} ราย
              </Badge>
            </div>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "var(--slate-500)" }}>
              เลือกรายชื่อลูกค้าที่ต้องการจัดเส้นทางเข้าพบประจำวันนี้
            </p>
          </div>

          {/* Quick Selection Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectHighPriority}
              style={{ fontSize: "0.75rem", padding: "4px 10px" }}
              title="เลือกเฉพาะลูกค้าความสำคัญระดับสูงที่มีพิกัดพร้อม"
            >
              🔥 เลือกกลุ่มด่วน (High Priority)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectAllRoutable}
              style={{ fontSize: "0.75rem", padding: "4px 10px" }}
              title="เลือกลูกค้าทั้งหมดที่มีพิกัดพร้อมในหน้านี้"
            >
              ✅ เลือกทั้งหมดที่มีพิกัด
            </Button>
            {selectedIds.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                style={{ fontSize: "0.75rem", padding: "4px 8px", color: "var(--slate-500)" }}
              >
                ล้างการเลือก
              </Button>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Search box */}
          <div style={{ flex: "1 1 200px", position: "relative" }}>
            <input
              type="text"
              placeholder="ค้นหาชื่อลูกค้า, รหัส KS-, หรือเขตที่อยู่..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 32px",
                fontSize: "0.8125rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                backgroundColor: "var(--bg-surface)",
                outline: "none",
                transition: "border-color var(--transition-fast)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary-600)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
            />
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", opacity: 0.5 }}>
              🔍
            </span>
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: "var(--slate-400)",
                  fontSize: "12px",
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Priority filter pills */}
          <div style={{ display: "flex", gap: "4px", backgroundColor: "var(--slate-100)", padding: "3px", borderRadius: "var(--radius-md)" }}>
            {[
              { label: "ทั้งหมด", value: "all" },
              { label: "🔴 สูง", value: "high" },
              { label: "🟡 กลาง", value: "medium" },
              { label: "🟢 ทั่วไป", value: "low" },
            ].map((tab) => {
              const active = priorityFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setPriorityFilter(tab.value)}
                  style={{
                    padding: "4px 8px",
                    fontSize: "0.75rem",
                    fontWeight: active ? 700 : 500,
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    backgroundColor: active ? "var(--white)" : "transparent",
                    color: active ? "var(--krungsri-navy)" : "var(--slate-600)",
                    boxShadow: active ? "var(--shadow-xs)" : "none",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Location status toggle */}
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value as "all" | "routable_only")}
            style={{
              padding: "7px 10px",
              fontSize: "0.75rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              backgroundColor: "var(--white)",
              color: "var(--slate-700)",
              cursor: "pointer",
            }}
          >
            <option value="all">📍 พิกัดทั้งหมด ({candidates.length})</option>
            <option value="routable_only">✅ มีพิกัดพร้อมนำทาง ({routableCount})</option>
          </select>
        </div>
      </div>

      {/* Candidates List Container */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingRight: "4px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxHeight: "560px",
        }}
      >
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "10px 0" }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  height: "90px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--slate-100)",
                  animation: "pulse 1.5s infinite",
                }}
              />
            ))}
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              backgroundColor: "var(--slate-50)",
              borderRadius: "var(--radius-lg)",
              border: "1px dashed var(--border-subtle)",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔍</div>
            <div style={{ fontWeight: 600, color: "var(--slate-700)", marginBottom: "4px" }}>
              ไม่พบรายชื่อลูกค้าที่ตรงกับเงื่อนไข
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--slate-500)" }}>
              ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองเพื่อดูรายชื่อทั้งหมด
            </div>
          </div>
        ) : (
          filteredCandidates.map((c) => {
            const isSelected = selectedIds.has(c.customer_id);
            const isRoutable = c.routable;

            return (
              <div
                key={c.customer_id}
                onClick={() => {
                  if (isRoutable) onToggleCustomer(c.customer_id);
                }}
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-md)",
                  border: isSelected
                    ? "2px solid var(--primary-600)"
                    : "1px solid var(--border-subtle)",
                  backgroundColor: isSelected
                    ? "var(--primary-50)"
                    : isRoutable
                    ? "var(--white)"
                    : "var(--slate-50)",
                  cursor: isRoutable ? "pointer" : "not-allowed",
                  transition: "all var(--transition-fast)",
                  boxShadow: isSelected ? "var(--shadow-sm)" : "var(--shadow-xs)",
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  opacity: isRoutable ? 1 : 0.65,
                }}
              >
                {/* Checkbox */}
                <div style={{ paddingTop: "2px" }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={!isRoutable}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (isRoutable) onToggleCustomer(c.customer_id);
                    }}
                    style={{
                      width: "18px",
                      height: "18px",
                      cursor: isRoutable ? "pointer" : "not-allowed",
                      accentColor: "var(--krungsri-yellow)",
                    }}
                  />
                </div>

                {/* Main Customer Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Row 1: Name, Ref, Priority */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--krungsri-navy)" }}>
                        {c.customer_name}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--slate-500)", fontFamily: "monospace" }}>
                        {c.external_ref}
                      </span>
                      {c.relationship_tier && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "1px 6px",
                            borderRadius: "var(--radius-full)",
                            backgroundColor: "var(--slate-200)",
                            color: "var(--slate-700)",
                            fontWeight: 600,
                          }}
                        >
                          {c.relationship_tier}
                        </span>
                      )}
                    </div>

                    {/* Priority Badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                      {c.priority_score !== null && c.priority_score !== undefined && (
                        <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--krungsri-navy)" }}>
                          {c.priority_score} คะแนน
                        </span>
                      )}
                      <Badge
                        variant={
                          c.priority_level === "high"
                            ? "danger"
                            : c.priority_level === "medium"
                            ? "warning"
                            : "success"
                        }
                        size="sm"
                      >
                        {c.priority_level === "high"
                          ? "เร่งด่วนสูง"
                          : c.priority_level === "medium"
                          ? "ปานกลาง"
                          : "ทั่วไป"}
                      </Badge>
                    </div>
                  </div>

                  {/* Row 2: Why Now */}
                  {c.why_now && (
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#854d0e",
                        backgroundColor: "#fefce8",
                        padding: "4px 8px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid #fef08a",
                        marginBottom: "6px",
                        display: "flex",
                        alignItems: "baseline",
                        gap: "5px",
                        fontFamily: "var(--font-reading-thai)",
                      }}
                    >
                      <span style={{ fontWeight: 700, flexShrink: 0, fontFamily: "var(--font-ui-thai)" }}>⚡ Why Now:</span>
                      <span style={{ lineHeight: "var(--lh-reading, 1.7)" }}>{c.why_now}</span>
                    </div>
                  )}

                  {/* Row 3: Relevant Insight / Recommended Action */}
                  {c.recommended_next_action && (
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--slate-600)",
                        marginBottom: "6px",
                        display: "flex",
                        alignItems: "baseline",
                        gap: "5px",
                        fontFamily: "var(--font-reading-thai)",
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "var(--slate-700)", flexShrink: 0, fontFamily: "var(--font-ui-thai)" }}>💡 Insight:</span>
                      <span style={{ lineHeight: "var(--lh-reading, 1.7)" }}>{c.recommended_next_action}</span>
                    </div>
                  )}

                  {/* Row 4: Location Status & Coordinates */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginTop: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem" }}>
                      {isRoutable ? (
                        <span style={{ color: "var(--success-text)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <span>📍</span>
                          <span>
                            {c.district ? `เขต${c.district}, ${c.province || "กรุงเทพฯ"}` : "พิกัดพร้อมนำทาง"}
                          </span>
                          {c.latitude && c.longitude && (
                            <span style={{ color: "var(--slate-400)", fontFamily: "monospace" }}>
                              ({c.latitude.toFixed(3)}, {c.longitude.toFixed(3)})
                            </span>
                          )}
                        </span>
                      ) : (
                        <Tooltip content={c.unroutable_reason || "ลูกค้าไม่มีข้อมูลพิกัด GPS ไม่สามารถคำนวณเส้นทางได้"}>
                          <span style={{ color: "var(--danger-text)", display: "flex", alignItems: "center", gap: "4px" }}>
                            <span>⚠️</span>
                            <span>ไม่มีพิกัด GPS (ไม่สามารถนำทางได้)</span>
                          </span>
                        </Tooltip>
                      )}
                    </div>

                    {c.protection_gap && (
                      <span style={{ fontSize: "0.75rem", color: "var(--slate-500)", fontStyle: "italic" }}>
                        🛡️ {c.protection_gap}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px solid var(--slate-100)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--slate-500)" }}>
        <span>
          แสดง {filteredCandidates.length} จากทั้งหมด {candidates.length} รายการ
        </span>
        {unroutableCount > 0 && (
          <span style={{ color: "var(--slate-400)" }}>
            (ไม่มีพิกัด {unroutableCount} ราย)
          </span>
        )}
      </div>
    </div>
  );
}
