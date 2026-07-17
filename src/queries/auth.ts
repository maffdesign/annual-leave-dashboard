import { createClient } from "@/lib/supabase/server";
import type { Employee } from "@/types";

/**
 * 현재 로그인한 사용자의 직원 정보를 가져온다.
 * 로그인은 되어 있으나 employees에 연결(auth_id)되지 않은 경우 null.
 */
export async function getCurrentEmployee(): Promise<Employee | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("auth_id", user.id)
    .single();

  if (error) return null;
  return data;
}
