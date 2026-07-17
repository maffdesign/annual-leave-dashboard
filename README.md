# 🗓️ 연차 관리 대시보드 (Annual Leave Management System)

> 30명 규모 중소기업의 연차 관리를 **엑셀 수기 관리에서 자동화 시스템으로** 전환하기 위해 설계한 사내 연차 관리 대시보드입니다.
> **결재 없는 자동 등록제(셀프 서비스)** 를 중심으로, 근로기준법에 근거한 연차 자동 부여·검증부터 등록·취소·현황·알림까지 한 사이클을 구현했습니다.

🔗 **데모**: https://your-demo-url.vercel.app
🔑 **체험 계정**: 관리자 `admin@demo.com` / 직원 `user1@demo.com` (비밀번호 `demo1234`)

![대시보드 스크린샷](./docs/screenshot-dashboard.png)

---

## 1. 문제 정의 — 왜 만들었나

중소기업의 연차 관리는 대부분 **엑셀 수기 + 결재 대기**로 이뤄지며 다음 문제를 안고 있습니다.

- 📌 **부여일수 계산 오류**: 근속연수별 규정(최대 25일)을 매년 수기 계산 → 실수
- 📌 **결재 병목**: 관리자 승인을 기다리느라 연차 사용이 지연
- 📌 **현황 파악 지연**: "누가 며칠 남았는지, 이번 주 누가 쉬는지" 매번 취합
- 📌 **연차사용촉진 대상 누락**: 미사용 연차 소멸·수당 리스크 관리 어려움

> 경영지원 담당자 관점에서 **반복적이고 실수가 잦은 통제 업무를 시스템으로 대체**하는 것을 목표로 했습니다.

## 2. 핵심 컨셉 — 결재 없는 '자동 등록제'

**연차는 허가받는 것이 아니라 근로자의 권리(시기지정권)** 라는 원칙 위에 설계했습니다.

> 근로기준법 제60조상 연차는 회사가 허락하는 보상이 아니라 근로자가 시기를 지정해 사용하는 권리입니다. 회사는 사업에 '막대한 지장'이 있는 예외적 경우에만 **시기변경권**을 가질 뿐입니다.

따라서 **관리자 결재 단계를 제거**하고, 사람이 하던 통제를 **시스템의 검증 로직(가드레일)과 알림**으로 대체했습니다.

| 구분 | 일반적 방식(결재제) | 본 시스템(자동 등록제) |
|------|--------------------|------------------------|
| 신청 흐름 | 신청 → 대기 → 관리자 승인 | 등록 → 검증 통과 시 **즉시 확정** |
| 관리자 | 승인자(병목) | **감독자 + 시기변경권**(예외 개입) |
| 통제 주체 | 사람(판단) | **코드(가드레일)** + 알림 |

## 3. 주요 기능

**직원**
- 근로기준법 기반 연차 현황 대시보드(부여 근거·도넛 차트)
- **연차 자동 등록** — 결재 없이 즉시 확정, 실시간 신청일수·잔여 계산
- **부서 커버리지 실시간 표시** — 같은 부서 동시 연차 비율(초과 시 경고)
- **셀프 취소** — 시작 전 연차를 직접 취소(확인 모달)
- **팀 캘린더** — 전 직원 연차를 이름·부서·직급과 함께 월별 확인

**관리자(경영지원)**
- 전 직원 연차 현황(부서별 소진율·검색·필터)
- **등록 현황 피드** — 최근 등록 + 부서 집중 경고
- **시기변경권** — 예외적 개입 시 **사유 입력 필수**, 근로자에게 사유 공유

**공통**
- **Slack FYI 알림** — 연차 등록 시 / 관리자 개입 시 자동 공유(옵션)
- **브라우저 종료 시 자동 로그아웃**(세션 쿠키)

## 4. 설계 하이라이트 — "통제를 DB 계층으로"

자동 등록에서는 클라이언트가 API를 직접 호출해 앱 검증을 우회할 수 있습니다. 그래서 핵심 규칙을 **DB에 강제**했습니다.

- **잔여 초과 = 하드 차단**: `enforce_leave_balance` BEFORE INSERT 트리거가 DB에서 거부(우회 불가)
- **부서 커버리지 = 소프트 경고**: `department_coverage` 함수로 50% 초과 시 경고만(권리 원칙상 차단하지 않음)
- **팀 캘린더 = 최소 노출**: `get_team_calendar`(security definer)로 전 직원 연차를 보여주되 사유 등 민감정보는 제외
- **연차 자동 부여**: `calculate_annual_leave` 함수(SQL) + `calculateAnnualLeave`(TS)로 동일 규정을 양쪽에서 일관 관리
- **RLS**: 직원은 본인 것 등록·취소만, 집계·캘린더는 security definer 함수로만 열람

## 5. 근로기준법 기반 연차 자동 부여

| 구분 | 부여 기준 |
|------|-----------|
| 입사 1년 미만 | 1개월 개근 시 1일씩, **최대 11일** |
| 입사 1년 이상 | 기본 **15일** |
| 3년차 이상 | 매 2년마다 +1일, **최대 25일** |

입사일만 입력하면 규정에 따라 자동 산정됩니다. (`src/lib/calculateAnnualLeave.ts`, 유닛 테스트 포함)

## 6. 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend / DB | Supabase (PostgreSQL, Auth, RLS, 트리거, RPC) |
| 시각화 | Recharts |
| 알림 | Slack Incoming Webhook |
| 배포 | Vercel |

## 7. 데이터 모델 (요약)

```
employees      : id, auth_id, name, dept, position, hire_date, role, grant_type
leave_balances : employee_id, year, granted, used, carried_over, remaining(생성 컬럼)
leave_requests : id, employee_id, start_date, end_date, type, days, reason,
                 status, coverage_warning, approver_id, cancel_reason
```

## 8. 화면 미리보기

| 직원 대시보드 | 연차 등록(커버리지 경고) | 팀 캘린더 | 등록 현황(관리자) |
|:---:|:---:|:---:|:---:|
| ![](./docs/screenshot-dashboard.png) | ![](./docs/screenshot-register.png) | ![](./docs/screenshot-calendar.png) | ![](./docs/screenshot-admin.png) |

## 9. 로컬 실행

```bash
git clone https://github.com/maffdesign/annual-leave-dashboard.git
cd annual-leave-dashboard
npm install
cp .env.example .env.local   # Supabase URL / KEY 입력
npm run dev                  # http://localhost:3000
```

### 환경변수 (`.env.local`)
```bash
NEXT_PUBLIC_SUPABASE_URL=...        # Supabase > Settings > API > Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # Supabase > Settings > API > anon public
SLACK_WEBHOOK_URL=...               # (선택) Slack Incoming Webhook, 서버 전용
```

### DB 초기화 (Supabase SQL Editor)
1. `supabase/schema.sql` — 전체 스키마·트리거·함수·RLS·시드 (신규 설치용, 최종 상태)
2. 데모 로그인 계정 생성 후 `employees.auth_id` 연결 (schema.sql 하단 참고)

> 이미 구축된 DB를 단계적으로 올릴 때는 `supabase/migrations/` 의 파일을 순서대로 실행합니다:
> `v2_self_service.sql` → `v2_admin_cancel_reason.sql` → `v2_team_calendar.sql`
> (각 파일은 멱등이며, 스키마 변경 후 `notify pgrst, 'reload schema'` 로 캐시를 갱신합니다.)

## 10. 테스트 / 빌드

```bash
npm run test    # 연차 자동 부여 계산 유닛 테스트 (Vitest)
npm run build   # 프로덕션 빌드 + 타입체크
```

## 11. 버전 관리

- **`main`** — 현재 버전(v2, 자동 등록제)
- **`v1`** — 초기 버전(결재제) 보존 브랜치. `git checkout v1` 로 확인 가능

## 12. 다음 단계 (Roadmap)

MVP 범위를 명확히 하기 위해 아래는 의도적으로 제외했으며, 확장 방향으로 정리해 두었습니다.

- [ ] 반반차·특별휴가·경조사 등 휴가 유형 확장
- [ ] 부서별 커버리지 임계값 설정(현재 전사 50% 고정)
- [ ] Google Calendar 연동
- [ ] 급여 시스템 연동(연차수당 정산)
- [ ] 연차사용촉진 알림 자동화

---

> 본 프로젝트는 경영지원 직무 지원을 위한 포트폴리오로, 가상의 데이터를 사용합니다.
