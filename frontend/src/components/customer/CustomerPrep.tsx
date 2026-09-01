"use client";
import React, { useState } from "react";
import type { CustomerDetail, ConversationAssistantResponse } from "@/types";
import { Card, Button, Panel } from "@/components/ui";
import { AILabel } from "@/components/domain";

interface CustomerPrepProps {
  customer: CustomerDetail;
  conversationGuide: ConversationAssistantResponse | null;
  loading: boolean;
  onGenerateConversation: () => void;
}

export function CustomerPrep({
  conversationGuide,
  loading,
  onGenerateConversation,
}: CustomerPrepProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleCopyAll = () => {
    if (!conversationGuide) return;
    const fullText = [
      `วัตถุประสงค์การสนทนา: ${conversationGuide.conversation_objective}`,
      `\nประโยคเปิดการสนทนา:\n${conversationGuide.suggested_opening}`,
      `\nคำถามที่ควรสอบถาม:\n${conversationGuide.suggested_questions?.map((q, i) => `${i + 1}. ${q}`).join("\n")}`,
      `\nประเด็นสนทนาเชิงลึก:\n${conversationGuide.topics_to_explore?.map((t, i) => `${i + 1}. ${t}`).join("\n")}`,
      `\nข้อควรระวัง:\n${conversationGuide.potential_concerns?.map((c, i) => `- ${c}`).join("\n")}`,
    ].join("\n");

    handleCopy(fullText, "all");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <AILabel type="ai" label="AI Conversation Copilot (ผู้ช่วยเตรียมบทสนทนา)" />
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--slate-500)" }}>
            แนวทางสนทนาเฉพาะบุคคลเพื่อช่วยเปิดใจและสำรวจความต้องการ
          </span>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          {conversationGuide && (
            <Button
              variant="outline"
              size="sm"
              leftIcon="📋"
              onClick={handleCopyAll}
            >
              {copiedSection === "all" ? "✓ คัดลอกทั้งหมดแล้ว" : "คัดลอกบทสนทนาทั้งหมด"}
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            leftIcon="💬"
            onClick={onGenerateConversation}
            isLoading={loading}
          >
            {conversationGuide ? "สร้างแนวทางสนทนาใหม่" : "สร้างแนวทางสนทนา"}
          </Button>
        </div>
      </div>

      {conversationGuide ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {/* 1. Conversation Objective */}
          <Panel
            variant="ai"
            label="วัตถุประสงค์การสนทนา (Objective)"
            title={conversationGuide.conversation_objective}
          >
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--slate-600)" }}>
              เน้นการทำความเข้าใจเป้าหมายทางการเงินและการปิดช่องว่างความคุ้มครองโดยไม่กดดันลูกค้า
            </div>
          </Panel>

          {/* 2. Suggested Opening */}
          <Card
            title="🗣️ ประโยคเปิดการสนทนาที่แนะนำ (Suggested Opening)"
            headerAction={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(conversationGuide.suggested_opening, "opening")}
                style={{ color: "var(--primary-700)" }}
              >
                {copiedSection === "opening" ? "✓ คัดลอกแล้ว" : "คัดลอก"}
              </Button>
            }
          >
            <div
              style={{
                padding: "14px 16px",
                backgroundColor: "var(--slate-50)",
                borderLeft: "4px solid var(--primary-600)",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--fs-base)",
                color: "var(--slate-800)",
                lineHeight: 1.6,
                fontStyle: "italic",
              }}
            >
              "{conversationGuide.suggested_opening}"
            </div>
          </Card>

          {/* 3. Questions to Ask */}
          <Card title="❓ คำถามสำคัญที่ควรถาม (Questions to Ask)">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {conversationGuide.suggested_questions?.map((q, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "12px 14px",
                    backgroundColor: "var(--bg-surface-subtle)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <span style={{ fontWeight: 800, color: "var(--primary-700)", fontSize: "var(--fs-sm)" }}>
                      {idx + 1}.
                    </span>
                    <span style={{ fontSize: "var(--fs-sm)", color: "var(--slate-800)", lineHeight: 1.5 }}>
                      {q}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(q, `q-${idx}`)}
                    style={{ color: "var(--slate-500)", flexShrink: 0 }}
                  >
                    {copiedSection === `q-${idx}` ? "✓" : "คัดลอก"}
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* 4. Topics to Explore & Cautions Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
            {/* Topics to explore */}
            <Card title="🔍 ประเด็นที่ควรเจาะลึก (Topics to Explore)">
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "var(--fs-sm)", color: "var(--slate-700)", lineHeight: 1.7 }}>
                {conversationGuide.topics_to_explore?.map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
            </Card>

            {/* Cautions */}
            <Card title="⚠️ ข้อควรระวังในการสนทนา (Cautions)">
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "var(--fs-sm)", color: "var(--danger-text)", lineHeight: 1.7 }}>
                {conversationGuide.potential_concerns?.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </Card>
          </div>

          {conversationGuide.model_metadata && (
            <div style={{ fontSize: "11px", color: "var(--slate-400)", textAlign: "right" }}>
              สร้างโดย: {conversationGuide.model_metadata.provider} ({conversationGuide.model_metadata.model_name} v{conversationGuide.model_metadata.model_version})
            </div>
          )}
        </div>
      ) : (
        <Card>
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--slate-500)" }}>
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>💬</div>
            <div style={{ fontWeight: 700, fontSize: "var(--fs-base)", color: "var(--slate-800)", marginBottom: "4px" }}>
              ยังไม่มีแนวทางการสนทนาสำหรับลูกค้ารายนี้
            </div>
            <div style={{ fontSize: "var(--fs-xs)", maxWidth: "420px", margin: "0 auto 16px auto", lineHeight: 1.5 }}>
              กดปุ่มด้านล่างเพื่อให้ระบบ AI ช่วยวิเคราะห์ข้อมูลลูกค้าและร่างประโยคเปิด คำถามสำคัญ และประเด็นสนทนาเชิงลึก
            </div>
            <Button
              variant="primary"
              size="md"
              leftIcon="⚡"
              onClick={onGenerateConversation}
              isLoading={loading}
            >
              สร้างแนวทางการสนทนาทันที
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
