import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { asSessionCookie } from "./cookies";

/** 서버 컴포넌트 / 서버 액션 / 라우트 핸들러용 Supabase 클라이언트 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, asSessionCookie(options)),
            );
          } catch {
            // 서버 컴포넌트에서 호출된 경우 set이 무시될 수 있음.
            // 세션 갱신은 middleware가 담당하므로 안전하게 무시.
          }
        },
      },
    },
  );
}
