import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export const metadata: Metadata = {
  title: "Broker Insight AI — ผู้ช่วย AI สำหรับนายหน้าประกัน",
  description:
    "Broker Insight AI — ต้นแบบระบบ AI สำหรับนายหน้าประกันกรุงศรี ใช้ข้อมูลจำลองเท่านั้น",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>
        <div
          id="pilot-sandbox-banner"
          style={{
            backgroundColor: "#000000",
            color: "#ffffff",
            borderBottom: "1px solid #222222",
            padding: "6px 16px",
            fontSize: "12px",
            textAlign: "center",
            fontWeight: 500,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>🧪 <strong style={{ color: "#FECB00" }}>PILOT SANDBOX:</strong> สภาพแวดล้อมจำลองเพื่อการทดสอบนำร่อง (Synthetic Demo Dataset — Not Connected to Live Production)</span>
        </div>
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
