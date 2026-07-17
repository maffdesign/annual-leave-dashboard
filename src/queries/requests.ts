import { createClient } from "@/lib/supabase/server";
import type { LeaveRequest, LeaveRequestWithEmployee, LeaveType } from "@/types";

/** 팀 캘린더 표시용 안전 필드 (사유 등 민감정보 제외) */
export type CalendarLeave = {
  name: string;
  dept: string | null;
  position: string | null;
  type: LeaveType;
  start_date: string;
  end_date: string;
};

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
 * [v2] 관리자 등록 현황 피드 — 최근 등록된(approved) 연차 (신청자 조인).
 */
export async function getRegistrations(
  limit = 100,
): Promise<LeaveRequestWithEmployee[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leave_requests")
    .select(`*, employee:employees!leave_requests_employee_id_fkey ( id, name, dept, position )`)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as LeaveRequestWithEmployee[];
}

/**
 * 팀 캘린더용 — 지정 기간과 겹치는 '승인된' 연차(전 직원).
 * RLS상 일반 직원은 본인 것만 보이므로, security definer 함수로
 * 캘린더에 필요한 안전 필드만(사유 제외) 받아온다.
 */
export async function getTeamCalendar(
  from: string,
  to: string,
): Promise<CalendarLeave[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_team_calendar", {
    p_start: from,
    p_end: to,
  });

  if (error) throw error;
  return (data ?? []) as CalendarLeave[];
}
