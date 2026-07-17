import Link from "next/link";
import { PlusCircle } from "lucide-react";
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

function formatPeriod(start: string, end: string) {
  return start === end ? start : `${start} ~ ${end}`;
}

export default async function RequestsPage() {
  const employee = await getCurrentEmployee();
  const requests = employee ? await getMyRequests(employee.id) : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">내 신청 내역</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            총 {requests.length}건
          </p>
        </div>
        <Button asChild>
          <Link href="/requests/new">
            <PlusCircle />
            연차 신청
          </Link>
        </Button>
      </header>

      <Card>
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-16 text-center">
              <p className="text-sm font-medium">신청 내역이 없습니다</p>
              <p className="text-sm text-muted-foreground">
                우측 상단의 &lsquo;연차 신청&rsquo;으로 첫 신청을 해보세요.
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
                  <TableHead>신청일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {formatPeriod(r.start_date, r.end_date)}
                    </TableCell>
                    <TableCell>{LEAVE_TYPE_LABEL[r.type]}</TableCell>
                    <TableCell className="text-right">{r.days}일</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {r.reason ?? "-"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.created_at.slice(0, 10)}
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
