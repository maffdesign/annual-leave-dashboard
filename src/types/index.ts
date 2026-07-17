// 앱에서 다루기 편한 도메인 타입 (DB Row 기반 + 조인 결과)
import type { Database, LeaveType, RequestStatus } from "./database";

export type Employee = Database["public"]["Tables"]["employees"]["Row"];
export type LeaveBalance = Database["public"]["Tables"]["leave_balances"]["Row"];
export type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"];

export type { UserRole, GrantType, LeaveType, RequestStatus } from "./database";

/** 신청 목록에 신청자 정보를 붙인 조인 결과 (관리자 화면용) */
export type LeaveRequestWithEmployee = LeaveRequest & {
  employee: Pick<Employee, "id" | "name" | "dept" | "position">;
};

/** 직원 + 올해 잔여 현황 (관리자 전 직원 테이블용) */
export type EmployeeWithBalance = Employee & {
  balance: Pick<LeaveBalance, "granted" | "used" | "remaining" | "carried_over"> | null;
};

/** UI 라벨 매핑 */
export const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  full_day: "종일",
  half_day: "반차",
};

export const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: "대기",
  approved: "등록됨",
  rejected: "반려",
  cancelled: "취소됨",
};

/** 부서 커버리지 계산 결과 (department_coverage RPC) */
export type CoverageInfo = {
  dept_size: number;
  peak_count: number;
  peak_ratio: number;
  threshold: number;
  over_threshold: boolean;
};
