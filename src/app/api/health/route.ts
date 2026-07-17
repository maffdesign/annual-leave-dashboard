import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase 연결 확인용 헬스체크.
 *   개발 서버 실행 후 브라우저에서  http://localhost:3000/api/health  접속.
 *
 *   { "connected": true }   → .env.local 값이 정확하고 DB에 연결됨
 *   { "connected": false }  → URL/KEY 오타 또는 미설정 (reason/error 확인)
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  // 1) 환경변수 자체가 비었는지 확인
  if (!url || url.includes("여기에") || !hasKey) {
    return NextResponse.json(
      {
        connected: false,
        reason: ".env.local 의 URL/ANON_KEY 를 실제 값으로 채워주세요.",
      },
      { status: 500 },
    );
  }

  // 2) 실제로 DB에 질의해 연결 확인 (RLS로 행이 안 보여도 error 없으면 연결 성공)
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("employees")
      .select("id", { count: "exact", head: true });

    if (error) {
      return NextResponse.json(
        { connected: false, url, error: error.message },
        { status: 500 },
      );
    }
    return NextResponse.json({ connected: true, url });
  } catch (e) {
    return NextResponse.json(
      { connected: false, url, error: String(e) },
      { status: 500 },
    );
  }
}
