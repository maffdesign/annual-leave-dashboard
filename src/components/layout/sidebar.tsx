"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Users,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/login/actions";
import type { UserRole } from "@/types";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const employeeNav: NavItem[] = [
  { href: "/dashboard", label: "내 연차 현황", icon: LayoutDashboard },
  { href: "/requests", label: "내 신청 내역", icon: ClipboardList },
  { href: "/requests/new", label: "연차 신청", icon: PlusCircle },
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "전 직원 현황", icon: Users },
  { href: "/admin/approvals", label: "승인 대기", icon: CheckSquare },
  { href: "/admin/calendar", label: "팀 캘린더", icon: CalendarDays },
];

export function Sidebar({ role, name }: { role: UserRole; name: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-card md:flex">
      <div className="border-b px-6 py-5">
        <p className="text-sm font-semibold">연차 관리</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {name} · {role === "admin" ? "관리자" : "직원"}
        </p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
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
    </aside>
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
