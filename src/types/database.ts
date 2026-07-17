// Supabase 스키마와 1:1 대응하는 DB 타입.
// 실제 프로젝트에선 `supabase gen types typescript` 로 자동 생성 가능하지만,
// 스키마가 확정적이라 손으로 작성해 두었다. (schema.sql 과 동기화 유지)
//
// 주의: @supabase/supabase-js 가 요구하는 스키마 형태를 맞추기 위해
// 각 테이블에 Relationships, 스키마에 Views/Enums/CompositeTypes 키를 포함한다.
// 이게 없으면 insert/update 타입이 never 로 무너진다.

export type UserRole = "admin" | "employee";
export type GrantType = "hire_date" | "fiscal_year"; // 입사일 / 회계연도 기준
export type LeaveType = "full_day" | "half_day"; // 종일 / 반차
export type RequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface Database {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string;
          auth_id: string | null;
          name: string;
          dept: string | null;
          position: string | null;
          hire_date: string; // ISO date 'YYYY-MM-DD'
          role: UserRole;
          grant_type: GrantType;
          created_at: string;
        };
        Insert: {
          id?: string;
          auth_id?: string | null;
          name: string;
          dept?: string | null;
          position?: string | null;
          hire_date: string;
          role?: UserRole;
          grant_type?: GrantType;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["employees"]["Insert"]>;
        Relationships: [];
      };
      leave_balances: {
        Row: {
          id: string;
          employee_id: string;
          year: number;
          granted: number;
          used: number;
          carried_over: number;
          remaining: number; // generated column (읽기 전용)
        };
        Insert: {
          id?: string;
          employee_id: string;
          year: number;
          granted?: number;
          used?: number;
          carried_over?: number;
        };
        Update: Partial<
          Omit<
            Database["public"]["Tables"]["leave_balances"]["Insert"],
            "employee_id"
          >
        >;
        Relationships: [];
      };
      leave_requests: {
        Row: {
          id: string;
          employee_id: string;
          start_date: string;
          end_date: string;
          type: LeaveType;
          days: number;
          reason: string | null;
          status: RequestStatus;
          coverage_warning: boolean;
          approver_id: string | null;
          cancel_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          start_date: string;
          end_date: string;
          type?: LeaveType;
          days: number;
          reason?: string | null;
          status?: RequestStatus;
          coverage_warning?: boolean;
          approver_id?: string | null;
          cancel_reason?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["leave_requests"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      calculate_annual_leave: {
        Args: { p_hire_date: string; p_as_of?: string };
        Returns: number;
      };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      current_employee_id: { Args: Record<string, never>; Returns: string };
      department_coverage: {
        Args: { p_employee_id: string; p_start: string; p_end: string };
        Returns: {
          dept_size: number;
          peak_count: number;
          peak_ratio: number;
          threshold: number;
          over_threshold: boolean;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      grant_type: GrantType;
      leave_type: LeaveType;
      request_status: RequestStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
}
