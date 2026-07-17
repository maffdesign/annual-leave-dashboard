-- ============================================================
-- 연차 관리 대시보드 — Supabase Schema
-- Supabase SQL Editor에 그대로 붙여넣어 실행.
-- ============================================================

-- ── 0. ENUM 타입 ────────────────────────────────────────────
create type user_role      as enum ('admin', 'employee');
create type grant_type     as enum ('hire_date', 'fiscal_year');  -- 입사일/회계연도 기준
create type leave_type     as enum ('full_day', 'half_day');      -- 종일/반차
create type request_status as enum ('pending', 'approved', 'rejected');

-- ── 1. 직원 (employees) ─────────────────────────────────────
create table public.employees (
  id         uuid primary key default gen_random_uuid(),
  auth_id    uuid unique references auth.users(id) on delete set null,
  name       text        not null,
  dept       text,
  position   text,
  hire_date  date        not null,
  role       user_role   not null default 'employee',
  grant_type grant_type  not null default 'hire_date',
  created_at timestamptz not null default now()
);

-- ── 2. 연차 잔여 (leave_balances) ──────────────────────────
create table public.leave_balances (
  id           uuid primary key default gen_random_uuid(),
  employee_id  uuid not null references public.employees(id) on delete cascade,
  year         int  not null,
  granted      numeric(4,1) not null default 0,
  used         numeric(4,1) not null default 0,
  carried_over numeric(4,1) not null default 0,
  remaining    numeric(4,1) generated always as (granted + carried_over - used) stored,
  unique (employee_id, year)
);

-- ── 3. 연차 신청 (leave_requests) ──────────────────────────
create table public.leave_requests (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  start_date  date not null,
  end_date    date not null,
  type        leave_type not null default 'full_day',
  days        numeric(4,1) not null,
  reason      text,
  status      request_status not null default 'pending',
  approver_id uuid references public.employees(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint valid_period check (end_date >= start_date),
  constraint valid_days   check (days > 0)
);

create index idx_requests_employee on public.leave_requests(employee_id);
create index idx_requests_status   on public.leave_requests(status);
create index idx_balances_employee on public.leave_balances(employee_id, year);

-- ============================================================
-- 4. 근로기준법 기반 연차 부여일수 자동 계산 함수
-- ============================================================
create or replace function public.calculate_annual_leave(
  p_hire_date date,
  p_as_of     date default current_date
)
returns numeric
language plpgsql
immutable
as $$
declare
  v_years  int;
  v_months int;
begin
  v_years := extract(year from age(p_as_of, p_hire_date))::int;

  if v_years < 1 then
    v_months := (extract(year from age(p_as_of, p_hire_date)) * 12
               + extract(month from age(p_as_of, p_hire_date)))::int;
    return least(v_months, 11);
  else
    return least(15 + floor((v_years - 1) / 2.0), 25);
  end if;
end;
$$;

-- ============================================================
-- 5. 승인된 신청의 사용일수를 leave_balances.used 에 자동 반영
-- ============================================================
create or replace function public.recalc_leave_used()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_emp  uuid := coalesce(new.employee_id, old.employee_id);
  v_year int  := extract(year from coalesce(new.start_date, old.start_date))::int;
begin
  update public.leave_balances b
  set used = coalesce((
        select sum(r.days)
        from public.leave_requests r
        where r.employee_id = v_emp
          and r.status = 'approved'
          and extract(year from r.start_date)::int = v_year
      ), 0)
  where b.employee_id = v_emp and b.year = v_year;

  return coalesce(new, old);
end;
$$;

create trigger trg_recalc_used
after insert or update or delete on public.leave_requests
for each row execute function public.recalc_leave_used();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

create trigger trg_requests_updated_at
before update on public.leave_requests
for each row execute function public.set_updated_at();

-- ============================================================
-- 6. RLS (Row Level Security)
-- ============================================================
alter table public.employees      enable row level security;
alter table public.leave_balances enable row level security;
alter table public.leave_requests enable row level security;

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.employees
    where auth_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.current_employee_id()
returns uuid language sql security definer set search_path = public as $$
  select id from public.employees where auth_id = auth.uid();
$$;

create policy employees_select on public.employees for select
  using (auth_id = auth.uid() or public.is_admin());
create policy employees_admin_write on public.employees for all
  using (public.is_admin()) with check (public.is_admin());

create policy balances_select on public.leave_balances for select
  using (employee_id = public.current_employee_id() or public.is_admin());
create policy balances_admin_write on public.leave_balances for all
  using (public.is_admin()) with check (public.is_admin());

create policy requests_select on public.leave_requests for select
  using (employee_id = public.current_employee_id() or public.is_admin());
create policy requests_insert on public.leave_requests for insert
  with check (employee_id = public.current_employee_id() and status = 'pending');
create policy requests_admin_update on public.leave_requests for update
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- 7. 시드 데이터
-- ============================================================
insert into public.employees (name, dept, position, hire_date, role) values
  ('김민수', '경영지원팀', '팀장',  '2016-03-02', 'admin'),
  ('이서연', '개발팀',     '주임',  '2025-11-10', 'employee'),
  ('박지훈', '개발팀',     '대리',  '2023-01-16', 'employee'),
  ('최유진', '디자인팀',   '사원',  '2024-07-01', 'employee'),
  ('정우성', '영업팀',     '과장',  '2019-04-22', 'employee'),
  ('한소희', '영업팀',     '대리',  '2022-09-05', 'employee'),
  ('오현우', '경영지원팀', '사원',  '2026-02-03', 'employee'),
  ('임지아', '개발팀',     '차장',  '2013-06-18', 'employee');

insert into public.leave_balances (employee_id, year, granted, carried_over)
select
  id,
  extract(year from current_date)::int,
  public.calculate_annual_leave(hire_date, current_date),
  0
from public.employees;

-- ============================================================
-- 8. [수동] 데모 로그인 계정 연결
-- ------------------------------------------------------------
-- Supabase Dashboard > Authentication 에서 계정 생성 후:
--   admin@demo.com / demo1234,  user@demo.com / demo1234
-- update public.employees set auth_id = '<admin auth uuid>' where name = '김민수';
-- update public.employees set auth_id = '<user  auth uuid>' where name = '이서연';
-- ============================================================
