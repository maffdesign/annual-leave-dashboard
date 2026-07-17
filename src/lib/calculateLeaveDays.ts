import type { LeaveType } from "@/types";

/**
 * 연차 신청일수 계산.
 * - 반차(half_day): 0.5일
 * - 종일(full_day): 시작~종료일 사이 '주말 제외' 일수
 *
 * ⚠️ MVP에서는 공휴일은 제외하지 않는다(추후 공휴일 API 연동으로 확장).
 */
export function calculateLeaveDays(
  startDate: string,
  endDate: string,
  type: LeaveType,
): number {
  if (type === "half_day") return 0.5;

  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++; // 일(0)·토(6) 제외
  }
  return count;
}
