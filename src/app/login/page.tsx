import { CalendarDays } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <CalendarDays className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold">연차 관리 대시보드</h1>
          <p className="text-sm text-muted-foreground">사내 연차 신청·승인·현황 관리</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>로그인</CardTitle>
            <CardDescription>계정 정보를 입력해 주세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        {/* 포트폴리오 데모용 계정 안내 */}
        <div className="rounded-lg border border-dashed bg-card p-4 text-xs text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">데모 계정</p>
          <p>관리자 · admin@demo.com / demo1234</p>
          <p>직원 · user1@demo.com / demo1234</p>
        </div>
      </div>
    </main>
  );
}
