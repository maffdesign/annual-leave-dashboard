"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/queries/auth";
import { getBalance } from "@/queries/balances";
import { calculateLeaveDays } from "@/lib/calculateLeaveDays";
import { notifyLeaveRegistered } from "@/lib/notify";
import { LEAVE_TYPE_LABEL, type LeaveType } from "@/types";

export type RequestState = { error?: string };

/**
 * [v2] 연차 자동 등록.
 * 결재(pending) 없이 즉시 'approved'로 저장한다.
 * - 잔여 초과: DB 트리거(enforce_leave_balance)가 하드 차단
 * - 부서 커버리지: department_coverage 로 계산 → 경고 플래그만(등록은 진행)
 * - 등록 성공 시 Slack FYI 알림(옵션)
 */
export async function registerLeave(
  _prev: RequestState,
  formData: FormData,
): Promise<RequestState> {
  const employee = await getCurrentEmployee();
  if (!employee) return { error: "로그인이 필요합니다." };

  const type = String(formData.get("type") ?? "full_day") as LeaveType;
  const startDate = String(formData.get("start_date") ?? "");
  let endDate = String(formData.get("end_date") ?? "") || startDate;
  const reason = String(formData.get("reason") ?? "").trim();

  if (type === "half_day") endDate = startDate;

  if (!startDate) return { error: "시작일을 선택하세요." };
  if (endDate < startDate) {
    return { error: "종료일은 시작일보다 빠를 수 없습니다." };
  }

  const days = calculateLeaveDays(startDate, endDate, type);
  if (days <= 0) {
    return { error: "등록 가능한 일수가 없습니다. (주말만 선택됨)" };
  }

  const supabase = await createClient();

  // 잔여 사전 검증(친절한 메시지용, 최종 강제는 DB 트리거)
  const balance = await getBalance(employee.id);
  const remaining = balance?.remaining ?? 0;
  if (days > remaining) {
    return { error: `잔여 연차(${remaining}일)를 초과했습니다. (신청 ${days}일)` };
  }

  // 부서 커버리지 계산(soft) → 초과해도 등록은 진행, 경고 플래그만 저장
  let coverageWarning = false;
  const { data: cov } = await supabase.rpc("department_coverage", {
    p_employee_id: employee.id,
    p_start: startDate,
    p_end: endDate,
  });
  if (cov && cov.length > 0) coverageWarning = cov[0].over_threshold;

  const { error } = await supabase.from("leave_requests").insert({
    employee_id: employee.id,
    start_date: startDate,
    end_date: endDate,
    type,
    days,
    reason: reason || null,
    status: "approved",
    coverage_warning: coverageWarning,
  });

  if (error) {
    // DB 트리거가 잔여 초과 등으로 막은 경우 등
    return { error: `등록에 실패했습니다. (${error.message})` };
  }

  // FYI 알림 (실패해도 등록엔 영향 없음)
  await notifyLeaveRegistered({
    name: employee.name,
    dept: employee.dept,
    startDate,
    endDate,
    days,
    typeLabel: LEAVE_TYPE_LABEL[type],
    coverageWarning,
  });

  revalidatePath("/requests");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/admin/registrations");
  redirect("/requests");
}

/**
 * [v2] 본인 연차 셀프 취소.
 * 아직 시작하지 않은(미래) 연차만 취소 가능. status → 'cancelled'.
 * 취소 시 DB 트리거(recalc_leave_used)가 잔여를 자동 복구한다.
 */
export async function cancelLeave(requestId: string): Promise<RequestState> {
  const employee = await getCurrentEmployee();
  if (!employee) return { error: "로그인이 필요합니다." };

  const supabase = await createClient();

  const { data: req, error: fetchErr } = await supabase
    .from("leave_requests")
    .select("employee_id, start_date, status")
    .eq("id", requestId)
    .single();

  if (fetchErr || !req) return { error: "연차를 찾을 수 없습니다." };
  if (req.employee_id !== employee.id) return { error: "본인 연차만 취소할 수 있습니다." };
  if (req.status !== "approved") return { error: "취소할 수 없는 상태입니다." };

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  if (req.start_date <= todayKey) {
    return { error: "이미 시작했거나 오늘인 연차는 취소할 수 없습니다." };
  }

  const { error } = await supabase
    .from("leave_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId);

  if (error) return { error: `취소에 실패했습니다. (${error.message})` };

  revalidatePath("/requests");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return {};
}
