"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/queries/auth";
import { getBalance } from "@/queries/balances";
import type { RequestStatus } from "@/types";

export type ApprovalResult = { error?: string };

/**
 * 승인/반려 공통 처리.
 * - 관리자 권한 확인
 * - 이미 처리된(비-pending) 신청 재처리 방지
 * - 승인 시 잔여 초과 재검증 (여러 대기 신청 합산 초과 방어)
 * 승인되면 DB 트리거(recalc_leave_used)가 사용일수를 자동 반영한다.
 */
async function decide(
  requestId: string,
  status: Extract<RequestStatus, "approved" | "rejected">,
): Promise<ApprovalResult> {
  const admin = await getCurrentEmployee();
  if (admin?.role !== "admin") return { error: "권한이 없습니다." };

  const supabase = await createClient();

  const { data: req, error: fetchErr } = await supabase
    .from("leave_requests")
    .select("employee_id, days, status")
    .eq("id", requestId)
    .single();

  if (fetchErr || !req) return { error: "신청을 찾을 수 없습니다." };
  if (req.status !== "pending") return { error: "이미 처리된 신청입니다." };

  if (status === "approved") {
    const balance = await getBalance(req.employee_id);
    const remaining = balance?.remaining ?? 0;
    if (req.days > remaining) {
      return {
        error: `승인 불가: 잔여 ${remaining}일 < 신청 ${req.days}일`,
      };
    }
  }

  const { error } = await supabase
    .from("leave_requests")
    .update({ status, approver_id: admin.id })
    .eq("id", requestId)
    .eq("status", "pending"); // 동시성 방어: 대기 상태일 때만 갱신

  if (error) return { error: error.message };

  revalidatePath("/admin/approvals");
  revalidatePath("/admin");
  return {};
}

export async function approveRequest(requestId: string): Promise<ApprovalResult> {
  return decide(requestId, "approved");
}

export async function rejectRequest(requestId: string): Promise<ApprovalResult> {
  return decide(requestId, "rejected");
}
