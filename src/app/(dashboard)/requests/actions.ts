"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/queries/auth";
import { getBalance } from "@/queries/balances";
import { calculateLeaveDays } from "@/lib/calculateLeaveDays";
import type { LeaveType } from "@/types";

export type RequestState = { error?: string };

/**
 * 연차 신청 생성.
 * 신청일수·잔여 검증을 서버에서 다시 수행한다(클라이언트 값 신뢰 금지).
 * RLS 정책상 본인(employee_id) + status='pending' 만 insert가 허용된다.
 */
export async function createLeaveRequest(
  _prev: RequestState,
  formData: FormData,
): Promise<RequestState> {
  const employee = await getCurrentEmployee();
  if (!employee) return { error: "로그인이 필요합니다." };

  const type = String(formData.get("type") ?? "full_day") as LeaveType;
  const startDate = String(formData.get("start_date") ?? "");
  let endDate = String(formData.get("end_date") ?? "") || startDate;
  const reason = String(formData.get("reason") ?? "").trim();

  // 반차는 하루짜리
  if (type === "half_day") endDate = startDate;

  // --- 입력 검증 ---
  if (!startDate) return { error: "시작일을 선택하세요." };
  if (endDate < startDate) {
    return { error: "종료일은 시작일보다 빠를 수 없습니다." };
  }

  const days = calculateLeaveDays(startDate, endDate, type);
  if (days <= 0) {
    return { error: "신청 가능한 일수가 없습니다. (주말만 선택됨)" };
  }

  // --- 잔여 초과 검증 ---
  const balance = await getBalance(employee.id);
  const remaining = balance?.remaining ?? 0;
  if (days > remaining) {
    return {
      error: `잔여 연차(${remaining}일)를 초과했습니다. (신청 ${days}일)`,
    };
  }

  // --- 저장 ---
  const supabase = await createClient();
  const { error } = await supabase.from("leave_requests").insert({
    employee_id: employee.id,
    start_date: startDate,
    end_date: endDate,
    type,
    days,
    reason: reason || null,
    status: "pending",
  });

  if (error) {
    return { error: `신청 저장에 실패했습니다. (${error.message})` };
  }

  revalidatePath("/requests");
  redirect("/requests");
}
