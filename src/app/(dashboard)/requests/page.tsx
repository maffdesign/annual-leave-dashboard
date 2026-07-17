import Link from "next/link";
import { AlertTriangle, PlusCircle } from "lucide-react";
import { getCurrentEmployee } from "@/queries/auth";
import { getMyRequests } from "@/queries/requests";
import { LEAVE_TYPE_LABEL } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/requests/status-badge";
import { CancelButton } from "./cancel-button";

function formatPeriod(start: string, end: string) {
  return start === end ? start : `${start} ~ ${end}`;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function RequestsPage() {
  const employee = await getCurrentEmployee();
  const requests = employee ? await getMyRequests(employee.id) : [];
  const today = todayKey();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">내 연차 내역</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            총 {requests.length}건 · 시작 전 연차는 직접 취소할 수 있습니다.
          </p>
        </div>
        <Button asChild>
          <Link href="/requests/new">
            <PlusCircle />
            연차 등록
          </Link>
        </Button>
      </header>

      <Card>
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-16 text-center">
              <p className="text-sm font-medium">등록된 연차가 없습니다</p>
              <p className="text-sm text-muted-foreground">
                우측 상단의 &lsquo;연차 등록&rsquo;으로 바로 등록하세요.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>기간</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead className="text-right">일수</TableHead>
                  <TableHead>사유</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => {
                  const cancellable =
                    r.status === "approved" && r.start_date > today;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-1.5">
                          {formatPeriod(r.start_date, r.end_date)}
                          {r.coverage_warning && (
                            <AlertTriangle
                              className="h-3.5 w-3.5 text-amber-500"
                              aria-label="부서 집중 경고"
                            />
                          )}
                        </span>
                      </TableCell>
                      <TableCell>{LEAVE_TYPE_LABEL[r.type]}</TableCell>
                      <TableCell className="text-right">{r.days}일</TableCell>
                      <TableCell className="max-w-[180px] truncate text-muted-foreground">
                        {r.reason ?? "-"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {cancellable ? <CancelButton requestId={r.id} /> : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
