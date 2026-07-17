"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/queries/auth";

export type AdminActionResult = { error?: string };

/**
 * [v2] 관리자 시기변경권 — 예외적으로 등록된 연차를 취소.
 * 자동 등록제에서 결재는 없지만, '막대한 지장'이 있는 경우 관리자가 개입할 수 있다.
 * 개입은 근로자에게 설명 가능해야 하므로 '사유 입력을 필수'로 강제한다.
 * 취소 시 DB 트리거(recalc_leave_used)가 잔여를 자동 복구한다.
 */
export async function adminCancelLeave(
  requestId: string,
  reason: string,
): Promise<AdminActionResult> {
  const admin = await getCurrentEmployee();
  if (admin?.role !== "admin") return { error: "권한이 없습니다." };

  const trimmed = (reason ?? "").trim();
  if (!trimmed) return { error: "시기변경 사유를 입력해야 합니다." };

  const supabase = await createClient();

  const { error } = await supabase
    .from("leave_requests")
    .update({
      status: "cancelled",
      approver_id: admin.id,
      cancel_reason: trimmed,
    })
    .eq("id", requestId)
    .eq("status", "approved");

  if (error) return { error: error.message };

  revalidatePath("/admin/registrations");
  revalidatePath("/admin");
  revalidatePath("/requests");
  return {};
}
