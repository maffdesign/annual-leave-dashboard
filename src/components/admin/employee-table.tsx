"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { EmployeeWithBalance } from "@/types";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { UsageBar } from "./usage-bar";

export function EmployeeTable({
  employees,
}: {
  employees: EmployeeWithBalance[];
}) {
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState<string>("all");

  const depts = useMemo(
    () =>
      Array.from(
        new Set(employees.map((e) => e.dept).filter(Boolean) as string[]),
      ),
    [employees],
  );

  const filtered = useMemo(
    () =>
      employees.filter((e) => {
        const matchesQuery = !query || e.name.includes(query.trim());
        const matchesDept = dept === "all" || e.dept === dept;
        return matchesQuery && matchesDept;
      }),
    [employees, query, dept],
  );

  return (
    <div className="space-y-4">
      {/* 검색 + 부서 필터 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름 검색"
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            active={dept === "all"}
            onClick={() => setDept("all")}
            label="전체"
          />
          {depts.map((d) => (
            <FilterChip
              key={d}
              active={dept === d}
              onClick={() => setDept(d)}
              label={d}
            />
          ))}
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>부서</TableHead>
              <TableHead>직급</TableHead>
              <TableHead>입사일</TableHead>
              <TableHead className="text-right">부여</TableHead>
              <TableHead className="text-right">사용</TableHead>
              <TableHead className="text-right">잔여</TableHead>
              <TableHead>소진율</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-muted-foreground"
                >
                  조건에 맞는 직원이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((e) => {
                const granted = e.balance?.granted ?? 0;
                const used = e.balance?.used ?? 0;
                const remaining = e.balance?.remaining ?? 0;
                const rate = granted > 0 ? used / granted : 0;
                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell>{e.dept ?? "-"}</TableCell>
                    <TableCell>{e.position ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.hire_date}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {granted}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {used}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium tabular-nums",
                        remaining <= 3 && "text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {remaining}
                    </TableCell>
                    <TableCell>
                      <UsageBar rate={rate} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length}명 표시 중 (전체 {employees.length}명)
      </p>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "hover:bg-accent",
      )}
    >
      {label}
    </button>
  );
}
