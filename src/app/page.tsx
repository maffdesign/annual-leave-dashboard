import { redirect } from "next/navigation";

// 진입점: 인증 여부는 middleware가 처리하므로 대시보드로 보낸다.
export default function Home() {
  redirect("/dashboard");
}
