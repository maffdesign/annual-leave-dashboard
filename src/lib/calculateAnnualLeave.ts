/**
 * 입사일 기준 완료 개월 수를 계산.
 * SQL의 age()와 동일하게, 해당 '일(day)'에 도달해야 1개월로 인정한다.
 */
function completedMonths(hireDate: Date, asOf: Date): number {
  let months =
    (asOf.getFullYear() - hireDate.getFullYear()) * 12 +
    (asOf.getMonth() - hireDate.getMonth());

  if (asOf.getDate() < hireDate.getDate()) {
    months -= 1;
  }
  return Math.max(0, months);
}

/** 문자열('2023-01-16')·Date 모두 허용하고, 시간대 오차 없이 날짜만 파싱 */
function toDate(value: Date | string): Date {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * 근로기준법 기준 연차 부여일수 계산 (입사일 기준).
 *
 * - 입사 1년 미만: 1개월 개근 시 1일씩, 최대 11일
 * - 입사 1년 이상: 기본 15일, 3년차부터 2년마다 +1일, 최대 25일
 *
 * DB의 calculate_annual_leave() 와 동일 로직. (schema.sql 참고)
 */
export function calculateAnnualLeave(
  hireDate: Date | string,
  asOf: Date | string = new Date(),
): number {
  const hire = toDate(hireDate);
  const ref = toDate(asOf);

  const months = completedMonths(hire, ref);
  const years = Math.floor(months / 12);

  if (years < 1) {
    return Math.min(months, 11);
  }
  return Math.min(15 + Math.floor((years - 1) / 2), 25);
}

/** 근속연수별 상세 내역 — 대시보드 툴팁·설명에 활용 */
export function getLeaveDetail(
  hireDate: Date | string,
  asOf: Date | string = new Date(),
) {
  const months = completedMonths(toDate(hireDate), toDate(asOf));
  const years = Math.floor(months / 12);
  const granted = calculateAnnualLeave(hireDate, asOf);

  return {
    serviceMonths: months,
    serviceYears: years,
    granted,
    isUnderOneYear: years < 1,
    isCapped: granted === 25,
  };
}
