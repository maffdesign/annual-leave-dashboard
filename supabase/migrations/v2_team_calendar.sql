-- ============================================================
-- v2 추가: 팀 캘린더를 전 직원이 볼 수 있게 하는 함수
--   일반 직원은 RLS상 본인 연차만 조회되므로, 캘린더 표시에 필요한
--   안전 필드(이름·부서·직급·유형·기간)만 security definer 로 노출한다.
--   (사유 등 민감정보는 반환하지 않음)
-- 이미 v2 마이그레이션을 적용한 DB에 이 파일만 추가 실행.
-- ============================================================

create or replace function public.get_team_calendar(
  p_start date,
  p_end date
)
returns table (
  name text,
  dept text,
  "position" text,
  type leave_type,
  start_date date,
  end_date date
)
language sql
security definer
set search_path = public
as $$
  select e.name, e.dept, e.position, r.type, r.start_date, r.end_date
  from public.leave_requests r
  join public.employees e on e.id = r.employee_id
  where r.status = 'approved'
    and r.start_date <= p_end
    and r.end_date >= p_start;
$$;

grant execute on function public.get_team_calendar(date, date) to anon, authenticated;

notify pgrst, 'reload schema';
