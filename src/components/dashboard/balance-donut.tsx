"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

type Props = {
  used: number;
  remaining: number;
};

const REMAINING_COLOR = "#10b981"; // emerald-500
const USED_COLOR = "hsl(var(--muted))"; // 테마 대응 (라이트/다크)

export function BalanceDonut({ used, remaining }: Props) {
  const total = used + remaining;

  // 데이터가 전부 0이면 빈 링을 표시하기 위한 더미
  const data =
    total === 0
      ? [{ name: "없음", value: 1, color: "hsl(var(--muted))" }]
      : [
          { name: "잔여", value: remaining, color: REMAINING_COLOR },
          { name: "사용", value: used, color: USED_COLOR },
        ];

  const usageRate = total === 0 ? 0 : Math.round((used / total) * 100);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-48 w-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={66}
              outerRadius={88}
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold leading-none">{remaining}</span>
          <span className="mt-1 text-xs text-muted-foreground">
            잔여 / 총 {total}일
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <LegendDot color={REMAINING_COLOR} label={`잔여 ${remaining}일`} />
        <LegendDot color="hsl(var(--muted-foreground))" label={`사용 ${used}일`} />
      </div>
      <p className="text-xs text-muted-foreground">사용률 {usageRate}%</p>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
