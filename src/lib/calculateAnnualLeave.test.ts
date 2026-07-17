import { describe, it, expect } from "vitest";
import { calculateAnnualLeave } from "./calculateAnnualLeave";

describe("calculateAnnualLeave — 근로기준법 부여일수", () => {
  it("입사 1년 미만은 완료 개월 수(최대 11일)", () => {
    expect(calculateAnnualLeave("2026-01-01", "2026-07-17")).toBe(6);
    expect(calculateAnnualLeave("2025-01-01", "2025-12-31")).toBe(11);
  });

  it("입사 1년차는 15일", () => {
    expect(calculateAnnualLeave("2025-07-17", "2026-07-17")).toBe(15);
  });

  it("3년차부터 2년마다 +1일", () => {
    expect(calculateAnnualLeave("2023-07-17", "2026-07-17")).toBe(16);
    expect(calculateAnnualLeave("2021-07-17", "2026-07-17")).toBe(17);
  });

  it("최대 25일 상한", () => {
    expect(calculateAnnualLeave("2000-01-01", "2026-07-17")).toBe(25);
  });
});
