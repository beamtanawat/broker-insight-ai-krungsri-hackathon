"use client";
import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { api, streamChat } from "@/lib/api";
import type { ChatMessage, User } from "@/types";
import { AppShell } from "@/components/layout";
import { Card, Badge, Button, EmptyState } from "@/components/ui";
import { PageHeader } from "@/components/domain";

function ChatContent() {
  const router = useRouter();
  const params = useSearchParams();
  const customerId = params.get("customer");
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(textToSend?: string) {
    const query = textToSend || input;
    if (!query.trim() || streaming) return;
    const userMsg: ChatMessage = { role: "user", content: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    let assistantContent = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    await streamChat(
      userMsg.content,
      customerId,
      sessionId,
      (chunk) => {
        assistantContent += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: assistantContent };
          return updated;
        });
      },
      (sid) => setSessionId(sid)
    );
    setStreaming(false);
  }

  const QUICK_PROMPTS = [
    "สรุปปัจจัยสำคัญที่ทำให้ลูกค้ามีความสำคัญสูง",
    "ขอแนวทางเปิดบทสนทนาเรื่องการต่ออายุกรมธรรม์",
    "ช่วยเปรียบเทียบแผนประกันสุขภาพกับแผนคุ้มครองโรคร้ายแรง",
    "มีข้อควรระวังหรือข้อมูลที่ยังขาดในการพูดคุยไหม",
  ];

  return (
    <AppShell user={user}>
      {/* ── Page Header ── */}
      <PageHeader
        title="ผู้ช่วยสนทนา AI Copilot (Conversation Assistant)"
        description="ผู้ช่วยอัจฉริยะสำหรับเตรียมบทสนทนา แนะนำประเด็นคำถาม และสรุปข้อมูลลูกค้า"
        breadcrumbs={[
          { label: "พื้นที่ทำงาน (Workspace)" },
          { label: "AI Copilot" },
        ]}
        primaryAction={
          customerId ? (
            <Badge variant="info" size="md">
              ลูกค้าที่เลือก: {customerId.slice(0, 10)}...
            </Badge>
          ) : undefined
        }
        secondaryAction={
          <Link href="/dashboard">
            <Button variant="outline" size="sm" leftIcon="🏠">
              แดชบอร์ด
            </Button>
          </Link>
        }
      />

      <div style={{ maxWidth: "960px", margin: "0 auto", display: "flex", flexDirection: "column", height: "calc(100vh - 220px)" }}>
        
        {/* Chat History Container */}
        <Card
          noPadding
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            marginBottom: "var(--space-4)",
            backgroundColor: "var(--white)",
          }}
        >
          <div style={{ flex: 1, padding: "var(--space-5)", overflowY: "auto", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {messages.length === 0 ? (
              <EmptyState
                icon="💬"
                title="เริ่มสนทนากับ AI Copilot"
                description="พิมพ์คำถาม หรือเลือกจากหัวข้อแนะนำด้านล่าง เพื่อขอความช่วยเหลือในการวิเคราะห์และเตรียมบทสนทนา"
              />
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "80%",
                      padding: "12px 16px",
                      borderRadius: "var(--radius-lg)",
                      backgroundColor: m.role === "user" ? "var(--primary-700)" : "var(--slate-100)",
                      color: m.role === "user" ? "var(--white)" : "var(--slate-900)",
                      fontSize: "var(--fs-sm)",
                      lineHeight: 1.6,
                      borderBottomRightRadius: m.role === "user" ? "2px" : "var(--radius-lg)",
                      borderBottomLeftRadius: m.role === "assistant" ? "2px" : "var(--radius-lg)",
                      boxShadow: "var(--shadow-xs)",
                    }}
                  >
                    {m.role === "assistant" && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--primary-700)", textTransform: "uppercase" }}>
                          ⚡ AI Copilot
                        </span>
                      </div>
                    )}
                    <div>
                      {m.content}
                      {streaming && idx === messages.length - 1 && m.role === "assistant" && (
                        <span style={{ display: "inline-block", width: "8px", height: "14px", backgroundColor: "var(--primary-700)", marginLeft: "4px", animation: "pulse 1s infinite" }} />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Prompts Strip */}
          {messages.length === 0 && (
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border-subtle)", backgroundColor: "var(--slate-50)", display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "var(--white)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-full)",
                    fontSize: "var(--fs-xs)",
                    color: "var(--slate-700)",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--primary-500)";
                    (e.currentTarget as HTMLElement).style.color = "var(--primary-700)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                    (e.currentTarget as HTMLElement).style.color = "var(--slate-700)";
                  }}
                >
                  💡 {prompt}
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Input Area */}
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="พิมพ์ข้อความที่ต้องการสอบถาม AI... (กด Enter เพื่อส่ง, Shift+Enter เพื่อขึ้นบรรทัดใหม่)"
            rows={2}
            disabled={streaming}
            style={{
              flex: 1,
              padding: "10px 14px",
              fontSize: "var(--fs-sm)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              backgroundColor: "var(--white)",
              color: "var(--slate-900)",
              outline: "none",
              resize: "none",
            }}
          />
          <Button
            variant="primary"
            size="md"
            onClick={() => handleSend()}
            disabled={streaming || !input.trim()}
            isLoading={streaming}
          >
            ส่งข้อความ
          </Button>
        </div>

      </div>
    </AppShell>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>กำลังโหลด...</div>}>
      <ChatContent />
    </Suspense>
  );
}
