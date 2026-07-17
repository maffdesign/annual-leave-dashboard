"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string };

/** 이메일/비밀번호 로그인. 성공 시 대시보드로 이동. */
export async function signIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 모두 입력하세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  // redirect는 내부적으로 예외를 던지므로 try/catch 밖에서 호출.
  redirect("/dashboard");
}

/** 로그아웃. 세션 종료 후 로그인 화면으로. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
