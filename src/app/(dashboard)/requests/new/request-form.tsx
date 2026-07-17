"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, CalendarClock, Send, Users } from "lucide-react";
import { registerLeave, type RequestState } from "../actions";
import { calculateLeaveDays } from "@/lib/calculateLeaveDays";
import { createClient } from "@/lib/supabase/client";
import type { CoverageInfo, LeaveType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const initialState: RequestState = {};

export function RequestForm({
  remaining,
  employeeId,
}: {
  remaining: number;
  employeeId: string;
}) {
  const [state, formAction, pending] = useActionState(
    registerLeave,
    initialState,
  );

  const [type, setType] = useState<LeaveType>("full_day");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [coverage, setCoverage] = useState<CoverageInfo | null>(null);

  const effectiveEnd = type === "half_day" ? start : end || start;

  const days = useMemo(() => {
    if (!start || effectiveEnd < start) return 0;
    return calculateLeaveDays(start, effectiveEnd, type);
  }, [start, effectiveEnd, type]);

  // 실시간 부서 커버리지 조회 (경고용, 등록을 막지는 않음)
  useEffect(() => {
    if (!start || effectiveEnd < start) {
      setCoverage(null);
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    supabase
      .rpc("department_coverage", {
        p_employee_id: employeeId,
        p_start: start,
        p_end: effectiveEnd,
      })
      .then(({ data }) => {
        if (!cancelled) setCoverage(data && data.length > 0 ? data[0] : null);
      });
    return () => {
      cancelled = true;
    };
  }, [start, effectiveEnd, employeeId]);

  const exceeds = days > remaining; // 잔여 초과(하드): 등록 차단
  const afterRemaining = remaining - days;
  const canSubmit = start !== "" && days > 0 && !exceeds && !pending;

  return (
    <form action={formAction} className="space-y-6">
      {/* 유형 */}
      <div className="space-y-2">
        <Label>유형</Label>
        <input type="hidden" name="type" value={type} />
        <div className="grid grid-cols-2 gap-2">
          <TypeToggle
            active={type === "full_day"}
            onClick={() => setType("full_day")}
            label="종일"
            hint="하루 1일 (주말 제외)"
          />
          <TypeToggle
            active={type === "half_day"}
            onClick={() => setType("half_day")}
            label="반차"
            hint="0.5일"
          />
        </div>
      </div>

      {/* 날짜 */}
      <div className={cn("grid gap-4", type === "full_day" && "sm:grid-cols-2")}>
        <div className="space-y-2">
          <Label htmlFor="start_date">
            {type === "half_day" ? "날짜" : "시작일"}
          </Label>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
          />
        </div>

        {type === "full_day" && (
          <div className="space-y-2">
            <Label htmlFor="end_date">종료일</Label>
            <Input
              id="end_date"
              name="end_date"
              type="date"
              value={end}
              min={start || undefined}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* 사유 */}
      <div className="space-y-2">
        <Label htmlFor="reason">사유 (선택)</Label>
        <Textarea
          id="reason"
          name="reason"
          placeholder="예) 개인 사유, 가족 행사 등"
          rows={3}
        />
      </div>

      {/* 신청일수 · 잔여 (하드) */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border p-4",
          exceeds ? "border-destructive/40 bg-destructive/5" : "bg-muted/40",
        )}
      >
        <CalendarClock
          className={cn(
            "h-5 w-5 shrink-0",
            exceeds ? "text-destructive" : "text-muted-foreground",
          )}
        />
        <div className="text-sm">
          <p>
            등록일수 <span className="font-semibold">{days}일</span>
            <span className="text-muted-foreground"> · 현재 잔여 {remaining}일</span>
          </p>
          {exceeds ? (
            <p className="text-destructive">
              잔여 연차를 {days - remaining}일 초과합니다. (등록 불가)
            </p>
          ) : days > 0 ? (
            <p className="text-muted-foreground">등록 후 잔여 {afterRemaining}일</p>
          ) : (
            <p className="text-muted-foreground">
              날짜를 선택하면 등록일수가 계산됩니다.
            </p>
          )}
        </div>
      </div>

      {/* 부서 커버리지 (soft, 경고만) */}
      {coverage && days > 0 && (
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg border p-4",
            coverage.over_threshold
              ? "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40"
              : "bg-muted/40",
          )}
        >
          {coverage.over_threshold ? (
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          ) : (
            <Users className="h-5 w-5 shrink-0 text-muted-foreground" />
          )}
          <div className="text-sm">
            <p>
              같은 부서 최대{" "}
              <span className="font-semibold">
                {coverage.peak_count}/{coverage.dept_size}명
              </span>{" "}
              연차 ({Math.round(coverage.peak_ratio * 100)}%)
            </p>
            {coverage.over_threshold ? (
              <p className="text-amber-700 dark:text-amber-400">
                권장 한도({Math.round(coverage.threshold * 100)}%) 초과 — 등록은
                가능하나 업무 공백을 확인해 주세요.
              </p>
            ) : (
              <p className="text-muted-foreground">
                권장 한도({Math.round(coverage.threshold * 100)}%) 이내입니다.
              </p>
            )}
          </div>
        </div>
      )}

      {state.error && (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={!canSubmit}>
          <Send />
          {pending ? "등록 중…" : "연차 등록"}
        </Button>
      </div>
    </form>
  );
}

function TypeToggle({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start rounded-lg border p-3 text-left transition-colors",
        active ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-accent",
      )}
    >
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </button>
  );
}
