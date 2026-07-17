import { createClient } from "@/lib/supabase/server";
import type { LeaveRequest, LeaveRequestWithEmployee, RequestStatus } from "@/types";

/** 특정 직원의 신청 내역 (본인 화면용) */
export async function getMyRequests(employeeId: string): Promise<LeaveRequest[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * 관리자용 신청 목록 (신청자 정보 조인).
 * status로 필터 (예: 'pending' → 승인 대기 목록).
 */
export async function getRequests(
  status?: RequestStatus,
): Promise<LeaveRequestWithEmployee[]> {
  const supabase = await createClient();

  let query = supabase
    .from("leave_requests")
    .select(`*, employee:employees!leave_requests_employee_id_fkey ( id, name, dept, position )`)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as LeaveRequestWithEmployee[];
}

/**
 * 팀 캘린더용 — 지정 기간과 겹치는 '승인된' 연차.
 */
export async function getApprovedInRange(
  from: string,
  to: string,
): Promise<LeaveRequestWithEmployee[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leave_requests")
    .select(`*, employee:employees!leave_requests_employee_id_fkey ( id, name, dept, position )`)
    .eq("status", "approved")
    .lte("start_date", to)
    .gte("end_date", from);

  if (error) throw error;
  return (data ?? []) as unknown as LeaveRequestWithEmployee[];
}
