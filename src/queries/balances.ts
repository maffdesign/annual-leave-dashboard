import { createClient } from "@/lib/supabase/server";
import type { LeaveBalance } from "@/types";

const currentYear = () => new Date().getFullYear();

/** 특정 직원의 해당 연도 연차 잔여 현황 */
export async function getBalance(
  employeeId: string,
  year: number = currentYear(),
): Promise<LeaveBalance | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leave_balances")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("year", year)
    .maybeSingle();

  if (error) throw error;
  return data;
}
