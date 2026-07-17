import { redirect } from "next/navigation";
import { CalendarPlus, CalendarCheck, CalendarClock, Users } from "lucide-react";
import { getCurrentEmployee } from "@/queries/auth";
import { getEmployeesWithBalance } from "@/queries/employees";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmployeeTable } from "@/components/admin/employee-table";
import { UsageBar } from "@/components/admin/usage-bar";

export default async function AdminPage() {
  const employee = await getCurrentEmployee();
  if (employee?.role !== "admin") redirect("/dashboard");

  const employees = await getEmployeesWithBalance();
  const year = new Date().getFullYear();

  // 전사 합계
  const totals = employees.reduce(
    (acc, e) => {
      acc.granted += e.balance?.granted ?? 0;
      acc.used += e.balance?.used ?? 0;
      acc.remaining += e.balance?.remaining ?? 0;
      return acc;
    },
    { granted: 0, used: 0, remaining: 0 },
  );
  const avgRate =
    totals.granted > 0 ? Math.round((totals.used / totals.granted) * 100) : 0;

  // 부서별 소진율
  const deptMap = new Map<string, { granted: number; used: number }>();
  for (const e of employees) {
    const key = e.dept ?? "미지정";
    const cur = deptMap.get(key) ?? { granted: 0, used: 0 };
    cur.granted += e.balance?.granted ?? 0;
    cur.used += e.balance?.used ?? 0;
    deptMap.set(key, cur);
  }
  const deptStats = Array.from(deptMap.entries())
    .map(([dept, v]) => ({
      dept,
      used: v.used,
      granted: v.granted,
      rate: v.granted > 0 ? v.used / v.granted : 0,
    }))
    .sort((a, b) => b.rate - a.rate);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">전 직원 연차 현황</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {year}년 기준 · 총 {employees.length}명
        </p>
      </header>

      {/* 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="총 직원" value={employees.length} unit="명" icon={Users} />
        <StatCard
          label="총 부여"
          value={totals.granted}
          unit="일"
          icon={CalendarPlus}
        />
        <StatCard
          label="총 사용"
          value={totals.used}
          unit="일"
          icon={CalendarCheck}
        />
        <StatCard
          label="평균 소진율"
          value={`${avgRate}%`}
          icon={CalendarClock}
          accent="emerald"
          hint={`잔여 합계 ${totals.remaining}일`}
        />
      </div>

      {/* 부서별 소진율 */}
      <Card>
        <CardHeader>
          <CardTitle>부서별 소진율</CardTitle>
          <CardDescription>부서별 부여 대비 사용 비율</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {deptStats.map((d) => (
            <div key={d.dept} className="flex items-center gap-4">
              <span className="w-24 shrink-0 text-sm font-medium">
                {d.dept}
              </span>
              <div className="flex-1">
                <UsageBar rate={d.rate} />
              </div>
              <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">
                {d.used} / {d.granted}일
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 직원 테이블 (검색·부서 필터) */}
      <Card>
        <CardHeader>
          <CardTitle>직원별 현황</CardTitle>
          <CardDescription>
            이름 검색·부서 필터로 개별 현황을 확인합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmployeeTable employees={employees} />
        </CardContent>
      </Card>
    </div>
  );
}
