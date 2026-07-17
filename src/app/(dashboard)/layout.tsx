import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/queries/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

// 대시보드 공통 레이아웃 — 인증 가드 + 사이드바(데스크톱) / 상단바·드로어(모바일).
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const employee = await getCurrentEmployee();

  // 로그인은 됐으나 직원 레코드에 연결되지 않은 경우 로그인으로.
  if (!employee) redirect("/login");

  return (
    <div className="flex min-h-screen">
      {/* 데스크톱: 좌측 고정 사이드바 */}
      <Sidebar role={employee.role} name={employee.name} />

      {/* 우측 컬럼: 모바일 상단바 + 본문 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav role={employee.role} name={employee.name} />
        <main className="flex-1 overflow-x-hidden bg-muted/30 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
