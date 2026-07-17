import type { CookieOptions } from "@supabase/ssr";

/**
 * 로그인 유지 쿠키를 '세션 쿠키'로 만든다.
 *   - maxAge / expires(만료 속성)를 제거하면 브라우저는 이 쿠키를
 *     '세션 쿠키'로 취급 → 브라우저를 닫으면 삭제되어 자동 로그아웃된다.
 *   - 단, 쿠키 '삭제'(로그아웃 시 maxAge<=0 / 과거 expires)는 그대로 둬야
 *     로그아웃이 정상 동작하므로 만료 속성을 유지한다.
 */
export function asSessionCookie(
  options?: CookieOptions,
): CookieOptions | undefined {
  if (!options) return options;

  const isDeletion =
    (typeof options.maxAge === "number" && options.maxAge <= 0) ||
    (options.expires instanceof Date && options.expires.getTime() <= Date.now());

  if (isDeletion) return options; // 삭제는 만료 속성 유지

  // 그 외(로그인/갱신)는 만료 속성 제거 → 세션 쿠키
  const { maxAge: _maxAge, expires: _expires, ...rest } = options;
  return rest;
}
