import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentEmployee } from "@/queries/auth";
import { getBalance } from "@/queries/balances";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RequestForm } from "./request-form";

export default async function NewRequestPage() {
  const employee = await getCurrentEmployee();
  if (!employee) return null;

  const balance = await getBalance(employee.id);
  const remaining = balance?.remaining ?? 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
          <Link href="/requests">
            <ArrowLeft />
            내 신청 내역
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">연차 등록</h1>
        <p className="text-sm text-muted-foreground">
          결재 없이 즉시 등록됩니다. 기간·유형만 선택하세요.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>등록 정보</CardTitle>
          <CardDescription>
            현재 잔여 연차 {remaining}일 · 잔여 초과는 등록 불가, 부서 집중은 경고로
            안내됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RequestForm remaining={remaining} employeeId={employee.id} />
        </CardContent>
      </Card>
    </div>
  );
}
