import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/queries/auth";
import { Sidebar } from "@/components/layout/sidebar";

// 대시보드 공통 레이아웃 — 인증 가드 + 사이드바.
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
      <Sidebar role={employee.role} name={employee.name} />
      <main className="flex-1 overflow-x-hidden bg-muted/30 p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
