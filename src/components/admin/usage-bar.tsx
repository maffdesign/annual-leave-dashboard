import { cn } from "@/lib/utils";

/** 소진율(사용/부여) 시각화 바. 서버·클라이언트 양쪽에서 사용 가능(순수 표현 컴포넌트). */
export function UsageBar({ rate }: { rate: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(rate * 100)));
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
        {pct}%
      </span>
    </div>
  );
}
