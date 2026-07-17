import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "연차 관리 대시보드",
  description: "중소기업 연차 관리 시스템",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  );
}
