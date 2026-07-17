import { createClient } from "@/lib/supabase/server";
import type { Employee, EmployeeWithBalance } from "@/types";

const currentYear = () => new Date().getFullYear();

type BalanceRow = {
  granted: number;
  used: number;
  remaining: number;
  carried_over: number;
  year: number;
};
type EmployeeJoinRow = Employee & { leave_balances: BalanceRow[] | null };

/**
 * 전 직원 + 올해 잔여 현황 (관리자 전 직원 테이블용).
 * RLS에 의해 관리자만 전체 조회가 허용된다.
 */
export async function getEmployeesWithBalance(
  year: number = currentYear(),
): Promise<EmployeeWithBalance[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("employees")
    .select(
      `*, leave_balances!left ( granted, used, remaining, carried_over, year )`,
    )
    .order("dept", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;

  // 해당 연도의 balance만 골라 평탄화
  const rows = (data ?? []) as unknown as EmployeeJoinRow[];
  return rows.map(({ leave_balances, ...employee }) => {
    const balance =
      (leave_balances ?? []).find((b) => b.year === year) ?? null;
    return { ...employee, balance } satisfies EmployeeWithBalance;
  });
}
