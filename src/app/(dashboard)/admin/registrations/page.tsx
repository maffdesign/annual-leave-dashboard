import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { getCurrentEmployee } from "@/queries/auth";
import { getRegistrations } from "@/queries/requests";
import { LEAVE_TYPE_LABEL } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminCancelButton } from "./admin-cancel-button";

function formatPeriod(start: string, end: string) {
  return start === end ? start : `${start} ~ ${end}`;
}

export default async function RegistrationsPage() {
  const employee = await getCurrentEmployee();
  if (employee?.role !== "admin") redirect("/dashboard");

  const registrations = await getRegistrations();
  const warningCount = registrations.filter((r) => r.coverage_warning).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">등록 현황</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          결재 없이 자동 등록된 연차 {registrations.length}건
          {warningCount > 0 && (
            <span className="text-amber-600 dark:text-amber-400">
              {" "}
              · 부서 집중 경고 {warningCount}건
            </span>
          )}
        </p>
      </header>

      <div className="rounded-lg border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
        연차는 근로자의 시기지정권으로 즉시 등록됩니다. 이 화면은 결재 큐가 아니라{" "}
        <b>공유(FYI)용</b>이며, 업무에 막대한 지장이 있는 예외적 경우에만 &lsquo;시기변경&rsquo;으로
        개입하세요.
      </div>

      <Card>
        <CardContent className="p-0">
          {registrations.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-16 text-center">
              <p className="text-sm font-medium">등록된 연차가 없습니다</p>
              <p className="text-sm text-muted-foreground">
                직원이 연차를 등록하면 여기에 표시됩니다.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>신청자</TableHead>
                  <TableHead>기간</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead className="text-right">일수</TableHead>
                  <TableHead>등록일</TableHead>
                  <TableHead>비고</TableHead>
                  <TableHead className="text-right">시기변경권</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.employee.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.employee.dept ?? "-"} · {r.employee.position ?? "-"}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPeriod(r.start_date, r.end_date)}
                    </TableCell>
                    <TableCell>{LEAVE_TYPE_LABEL[r.type]}</TableCell>
                    <TableCell className="text-right">{r.days}일</TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.created_at.slice(0, 10)}
                    </TableCell>
                    <TableCell>
                      {r.coverage_warning ? (
                        <Badge variant="warning" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          부서 집중
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <AdminCancelButton requestId={r.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
