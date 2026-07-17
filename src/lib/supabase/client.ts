import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트.
 *
 * URL / KEY 값은 여기서 하드코딩하지 않고 .env.local 에서 읽어온다.
 *   NEXT_PUBLIC_SUPABASE_URL       ← Supabase > Settings > API > Project URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  ← Supabase > Settings > API > anon public
 * (입력 위치: 프로젝트 루트의 .env.local 파일)
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
