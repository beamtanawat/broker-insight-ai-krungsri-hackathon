import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

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
            backgroundColor: "rgba(234, 179, 8, 0.12)",
            color: "#fde047",
            borderBottom: "1px solid rgba(234, 179, 8, 0.25)",
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
          <span>🧪 <strong>PILOT SANDBOX:</strong> สภาพแวดล้อมจำลองเพื่อการทดสอบนำร่อง (Synthetic Demo Dataset — Not Connected to Live Production)</span>
        </div>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
