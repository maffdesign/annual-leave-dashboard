import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: number | string;
  unit?: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  /** 강조 색상 (잔여일수 카드 등) */
  accent?: "default" | "emerald" | "amber";
};

const accentMap = {
  default: "text-foreground",
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
};

export function StatCard({
  label,
  value,
  unit,
  hint,
  icon: Icon,
  accent = "default",
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className={cn("h-5 w-5", accentMap[accent])} />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-0.5 flex items-baseline gap-1">
            <span className={cn("text-2xl font-bold", accentMap[accent])}>
              {value}
            </span>
            {unit && (
              <span className="text-sm text-muted-foreground">{unit}</span>
            )}
          </p>
          {hint && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {hint}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
