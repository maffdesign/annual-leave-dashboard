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
    // suppressHydrationWarning: 브라우저 확장/테마가 <html>·<body>에 속성을
    // 주입해 발생하는 하이드레이션 경고를 억제(앱 트리 검증에는 영향 없음).
    <html lang="ko" suppressHydrationWarning>
      <body
        className="min-h-screen bg-background antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
