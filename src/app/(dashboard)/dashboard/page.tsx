import Link from "next/link";
import {
  CalendarClock,
  CalendarPlus,
  CalendarCheck,
  PlusCircle,
} from "lucide-react";
import { getCurrentEmployee } from "@/queries/auth";
import { getBalance } from "@/queries/balances";
import { getLeaveDetail } from "@/lib/calculateAnnualLeave";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { BalanceDonut } from "@/components/dashboard/balance-donut";

export default async function DashboardPage() {
  const employee = await getCurrentEmployee();
  if (!employee) return null; // 레이아웃 가드에서 이미 처리됨

  const year = new Date().getFullYear();
  const balance = await getBalance(employee.id, year);
  const detail = getLeaveDetail(employee.hire_date);

  const granted = balance?.granted ?? 0;
  const used = balance?.used ?? 0;
  const remaining = balance?.remaining ?? 0;
  const carriedOver = balance?.carried_over ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* 헤더 */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">내 연차 현황</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {employee.name}님 · {employee.dept ?? "부서 미지정"} ·{" "}
            {employee.position ?? "-"} · {year}년 기준
          </p>
        </div>
        <Button asChild>
          <Link href="/requests/new">
            <PlusCircle />
            연차 신청
          </Link>
        </Button>
      </header>

      {balance === null ? (
        <EmptyBalance />
      ) : (
        <>
          {/* 통계 카드 3종 */}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="올해 부여"
              value={granted}
              unit="일"
              icon={CalendarPlus}
              hint={carriedOver > 0 ? `이월 ${carriedOver}일 포함` : undefined}
            />
            <StatCard
              label="사용"
              value={used}
              unit="일"
              icon={CalendarCheck}
            />
            <StatCard
              label="잔여"
              value={remaining}
              unit="일"
              icon={CalendarClock}
              accent="emerald"
            />
          </div>

          {/* 도넛 + 부여 근거 */}
          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>연차 사용 현황</CardTitle>
                <CardDescription>{year}년 부여 대비 사용·잔여</CardDescription>
              </CardHeader>
              <CardContent className="pb-8">
                <BalanceDonut used={used} remaining={remaining} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>부여 기준</CardTitle>
                <CardDescription>근로기준법에 따른 자동 산정 내역</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow label="입사일" value={employee.hire_date} />
                <InfoRow
                  label="근속"
                  value={`${detail.serviceYears}년 ${detail.serviceMonths % 12}개월`}
                />
                <InfoRow
                  label="부여 기준"
                  value={
                    employee.grant_type === "hire_date"
                      ? "입사일 기준"
                      : "회계연도 기준"
                  }
                />
                <div className="flex items-center gap-2 pt-2">
                  {detail.isUnderOneYear ? (
                    <Badge variant="warning">입사 1년 미만 · 월 1일씩 부여</Badge>
                  ) : (
                    <Badge variant="secondary">
                      기본 15일 + 근속 가산
                    </Badge>
                  )}
                  {detail.isCapped && (
                    <Badge variant="success">법정 상한 25일 도달</Badge>
                  )}
                </div>
                <p className="pt-1 text-xs text-muted-foreground">
                  입사 1년 미만은 1개월 개근 시 1일씩(최대 11일), 1년 이상은 기본
                  15일에 3년차부터 2년마다 1일씩 가산되어 최대 25일까지
                  부여됩니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b pb-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function EmptyBalance() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="text-sm font-medium">올해 연차 정보가 없습니다</p>
        <p className="text-sm text-muted-foreground">
          관리자에게 연차 부여를 요청하세요.
        </p>
      </CardContent>
    </Card>
  );
}
