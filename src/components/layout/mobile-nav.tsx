"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/login/actions";
import { adminNav, employeeNav, type NavItem } from "./nav-items";
import type { UserRole } from "@/types";

export function MobileNav({ role, name }: { role: UserRole; name: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // 라우트 이동 시 자동으로 닫기
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // 드로어 열렸을 때 배경 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* 모바일 상단 바 */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-card px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="메뉴 열기"
          className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold">연차 관리</span>
      </header>

      {/* 드로어 */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* 오버레이 */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          {/* 패널 */}
          <div className="absolute left-0 top-0 flex h-full w-64 flex-col bg-card shadow-xl">
            <div className="flex items-start justify-between border-b px-5 py-4">
              <div>
                <p className="text-sm font-semibold">연차 관리</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {name} · {role === "admin" ? "관리자" : "직원"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="메뉴 닫기"
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              <NavSection items={employeeNav} pathname={pathname} />
              {role === "admin" && (
                <>
                  <p className="px-3 pb-1 pt-4 text-xs font-medium text-muted-foreground">
                    경영지원
                  </p>
                  <NavSection items={adminNav} pathname={pathname} />
                </>
              )}
            </nav>

            <div className="border-t p-3">
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NavSection({
  items,
  pathname,
}: {
  items: NavItem[];
  pathname: string;
}) {
  return (
    <>
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </>
  );
}
