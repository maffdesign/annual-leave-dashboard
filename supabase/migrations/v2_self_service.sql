-- ============================================================
-- v1 → v2 마이그레이션: 결재제 → 자동 등록제(셀프 서비스)
-- 이미 schema.sql(v1)로 구축된 Supabase DB에 이 파일을 SQL Editor에서 실행.
-- (여러 번 실행해도 안전하도록 방어적으로 작성)
-- ============================================================

-- 1) enum에 'cancelled' 추가 (본인 취소용)
alter type request_status add value if not exists 'cancelled';

-- 2) 커버리지 경고 컬럼 + 신규 기본값(approved)
alter table public.leave_requests
  add column if not exists coverage_warning boolean not null default false;
alter table public.leave_requests
  alter column status set default 'approved';

-- 3) 기존 대기(pending) 신청을 즉시 승인 처리 (자동 등록제로 전환)
update public.leave_requests set status = 'approved' where status = 'pending';

-- 4) 잔여 초과 하드 가드레일 트리거
create or replace function public.enforce_leave_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_remaining numeric;
  v_year int := extract(year from new.start_date)::int;
begin
  if new.status = 'approved' then
    select granted + carried_over - used into v_remaining
    from public.leave_balances
    where employee_id = new.employee_id and year = v_year;

    if v_remaining is null then
      raise exception '연차 잔여 정보가 없습니다. (%년)', v_year;
    end if;
    if new.days > v_remaining then
      raise exception '잔여 연차(%일)를 초과했습니다. 신청 %일', v_remaining, new.days;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_balance on public.leave_requests;
create trigger trg_enforce_balance
before insert on public.leave_requests
for each row execute function public.enforce_leave_balance();

-- 5) 부서 커버리지 계산 함수 (soft 가드레일, 경고용)
create or replace function public.department_coverage(
  p_employee_id uuid,
  p_start date,
  p_end date
)
returns table (
  dept_size int,
  peak_count int,
  peak_ratio numeric,
  threshold numeric,
  over_threshold boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dept text;
  v_size int;
  v_threshold numeric := 0.5;   -- 50%
  v_peak int := 0;
  v_day date;
  v_cnt int;
begin
  select dept into v_dept from public.employees where id = p_employee_id;
  select count(*) into v_size
  from public.employees
  where coalesce(dept, '') = coalesce(v_dept, '');

  v_day := p_start;
  while v_day <= p_end loop
    select count(distinct r.employee_id) into v_cnt
    from public.leave_requests r
    join public.employees e on e.id = r.employee_id
    where r.status = 'approved'
      and r.employee_id <> p_employee_id
      and coalesce(e.dept, '') = coalesce(v_dept, '')
      and r.start_date <= v_day and r.end_date >= v_day;
    if v_cnt > v_peak then v_peak := v_cnt; end if;
    v_day := v_day + 1;
  end loop;

  dept_size := v_size;
  peak_count := v_peak + 1;
  peak_ratio := case when v_size > 0 then round((v_peak + 1)::numeric / v_size, 2) else 0 end;
  threshold := v_threshold;
  over_threshold := (v_size > 0) and ((v_peak + 1)::numeric / v_size > v_threshold);
  return next;
end;
$$;

grant execute on function public.department_coverage(uuid, date, date) to anon, authenticated;

-- 6) RLS 정책 교체: 자동 등록(approved) + 셀프 취소(cancelled)
drop policy if exists requests_insert on public.leave_requests;
create policy requests_insert on public.leave_requests for insert
  with check (employee_id = public.current_employee_id() and status = 'approved');

drop policy if exists requests_self_cancel on public.leave_requests;
-- 주의: 방금 ALTER TYPE 로 추가한 'cancelled'는 같은 트랜잭션에서 enum 값으로
-- 직접 쓸 수 없으므로(55P04), status::text 로 비교해 우회한다.
create policy requests_self_cancel on public.leave_requests for update
  using (employee_id = public.current_employee_id())
  with check (employee_id = public.current_employee_id() and status::text = 'cancelled');

-- (requests_admin_update 정책은 그대로 유지: 관리자 시기변경권)
