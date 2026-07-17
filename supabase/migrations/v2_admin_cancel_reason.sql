-- ============================================================
-- v2 추가: 관리자 시기변경권 개입 시 '사유' 저장 컬럼
-- 이미 v2_self_service.sql 을 실행한 DB에 이 파일만 추가로 실행.
-- ============================================================

alter table public.leave_requests
  add column if not exists cancel_reason text;
