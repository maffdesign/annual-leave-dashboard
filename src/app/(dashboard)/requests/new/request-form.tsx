"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertCircle, CalendarClock, Send } from "lucide-react";
import { createLeaveRequest, type RequestState } from "../actions";
import { calculateLeaveDays } from "@/lib/calculateLeaveDays";
import type { LeaveType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const initialState: RequestState = {};

export function RequestForm({ remaining }: { remaining: number }) {
  const [state, formAction, pending] = useActionState(
    createLeaveRequest,
    initialState,
  );

  const [type, setType] = useState<LeaveType>("full_day");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const effectiveEnd = type === "half_day" ? start : end || start;

  // 실시간 신청일수 계산 (서버 로직과 동일한 함수 재사용)
  const days = useMemo(() => {
    if (!start || effectiveEnd < start) return 0;
    return calculateLeaveDays(start, effectiveEnd, type);
  }, [start, effectiveEnd, type]);

  const exceeds = days > remaining;
  const afterRemaining = remaining - days;
  const canSubmit = start !== "" && days > 0 && !exceeds && !pending;

  return (
    <form action={formAction} className="space-y-6">
      {/* 유형: 종일 / 반차 세그먼트 */}
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

      {/* 실시간 미리보기 */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border p-4",
          exceeds
            ? "border-destructive/40 bg-destructive/5"
            : "bg-muted/40",
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
            신청일수{" "}
            <span className="font-semibold">{days}일</span>
            <span className="text-muted-foreground">
              {" "}
              · 현재 잔여 {remaining}일
            </span>
          </p>
          {exceeds ? (
            <p className="text-destructive">
              잔여 연차를 {days - remaining}일 초과합니다.
            </p>
          ) : days > 0 ? (
            <p className="text-muted-foreground">
              신청 후 잔여 {afterRemaining}일
            </p>
          ) : (
            <p className="text-muted-foreground">
              날짜를 선택하면 신청일수가 계산됩니다.
            </p>
          )}
        </div>
      </div>

      {/* 서버 에러 */}
      {state.error && (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={!canSubmit}>
          <Send />
          {pending ? "신청 중…" : "연차 신청"}
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
        active
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "hover:bg-accent",
      )}
    >
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </button>
  );
}
