import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCurrentEmployee } from "@/queries/auth";
import { getApprovedInRange } from "@/queries/requests";
import { LEAVE_TYPE_LABEL } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ── 날짜 유틸 (시간대 오차 없이 로컬 날짜만 다룬다) ──
function ymd(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
function parseDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const employee = await getCurrentEmployee();
  if (employee?.role !== "admin") redirect("/dashboard");

  const { month } = await searchParams;

  // 기준 연·월 결정 (?month=YYYY-MM, 기본: 이번 달)
  const today = new Date();
  let year = today.getFullYear();
  let mon = today.getMonth(); // 0-indexed
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    year = y;
    mon = m - 1;
  }

  const firstDay = new Date(year, mon, 1);
  const lastDay = new Date(year, mon + 1, 0);
  const from = ymd(firstDay);
  const to = ymd(lastDay);

  // 승인된 연차 조회 → 날짜별로 펼치기
  const leaves = await getApprovedInRange(from, to);
  const byDate = new Map<
    string,
    { name: string; type: string; dept: string | null }[]
  >();
  for (const lv of leaves) {
    let cur = parseDate(lv.start_date);
    const end = parseDate(lv.end_date);
    while (cur <= end) {
      const key = ymd(cur);
      const arr = byDate.get(key) ?? [];
      arr.push({
        name: lv.employee.name,
        type: LEAVE_TYPE_LABEL[lv.type],
        dept: lv.employee.dept,
      });
      byDate.set(key, arr);
      cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
    }
  }

  // 달력 그리드 (앞뒤 빈칸 포함, 7의 배수로 패딩)
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay.getDay(); i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, mon, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const prev = new Date(year, mon - 1, 1);
  const next = new Date(year, mon + 1, 1);
  const monthParam = (d: Date) =>
    `?month=${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const todayKey = ymd(today);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">팀 연차 캘린더</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            승인된 연차 · {leaves.length}건
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="icon">
            <Link href={monthParam(prev)} aria-label="이전 달">
              <ChevronLeft />
            </Link>
          </Button>
          <span className="w-28 text-center text-sm font-medium">
            {year}년 {mon + 1}월
          </span>
          <Button asChild variant="outline" size="icon">
            <Link href={monthParam(next)} aria-label="다음 달">
              <ChevronRight />
            </Link>
          </Button>
        </div>
      </header>

      <Card>
        <CardContent className="p-3 sm:p-4">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b pb-2">
            {WEEKDAYS.map((w, i) => (
              <div
                key={w}
                className={cn(
                  "text-center text-xs font-medium",
                  i === 0 && "text-red-500",
                  i === 6 && "text-blue-500",
                  i !== 0 && i !== 6 && "text-muted-foreground",
                )}
              >
                {w}
              </div>
            ))}
          </div>

          {/* 날짜 셀 */}
          <div className="grid grid-cols-7">
            {cells.map((date, idx) => {
              if (!date) return <div key={idx} className="min-h-24 border-b border-r" />;
              const key = ymd(date);
              const people = byDate.get(key) ?? [];
              const dow = date.getDay();
              const isToday = key === todayKey;

              return (
                <div
                  key={idx}
                  className={cn(
                    "min-h-24 border-b border-r p-1.5",
                    idx % 7 === 0 && "border-l",
                  )}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={cn(
                        "text-xs tabular-nums",
                        dow === 0 && "text-red-500",
                        dow === 6 && "text-blue-500",
                        isToday &&
                          "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground",
                      )}
                    >
                      {date.getDate()}
                    </span>
                    {people.length >= 3 && (
                      <span className="rounded bg-amber-100 px-1 text-[10px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                        {people.length}명
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    {people.slice(0, 3).map((p, i) => (
                      <div
                        key={i}
                        className="truncate rounded bg-muted px-1 py-0.5 text-[11px]"
                        title={`${p.name} · ${p.dept ?? ""} · ${p.type}`}
                      >
                        {p.name}
                        {p.type === "반차" && (
                          <span className="text-muted-foreground"> (반)</span>
                        )}
                      </div>
                    ))}
                    {people.length > 3 && (
                      <div className="px-1 text-[10px] text-muted-foreground">
                        +{people.length - 3}명
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        하루 3명 이상 연차 시 인원 배지로 표시됩니다. (업무 공백 확인용)
      </p>
    </div>
  );
}
