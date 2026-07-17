import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/queries/auth";
import { getRequests } from "@/queries/requests";
import { LEAVE_TYPE_LABEL } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApprovalActions } from "./approval-actions";

function formatPeriod(start: string, end: string) {
  return start === end ? start : `${start} ~ ${end}`;
}

export default async function ApprovalsPage() {
  const employee = await getCurrentEmployee();
  if (employee?.role !== "admin") redirect("/dashboard");

  const pending = await getRequests("pending");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">승인 대기</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          처리할 신청 {pending.length}건
        </p>
      </header>

      <Card>
        <CardContent className="p-0">
          {pending.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-16 text-center">
              <p className="text-sm font-medium">대기 중인 신청이 없습니다</p>
              <p className="text-sm text-muted-foreground">
                새 신청이 들어오면 여기에 표시됩니다.
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
                  <TableHead>사유</TableHead>
                  <TableHead>신청일</TableHead>
                  <TableHead className="text-right">처리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((r) => (
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
                    <TableCell className="max-w-[180px] truncate text-muted-foreground">
                      {r.reason ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.created_at.slice(0, 10)}
                    </TableCell>
                    <TableCell>
                      <ApprovalActions requestId={r.id} />
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
