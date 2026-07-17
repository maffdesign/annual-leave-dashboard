import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  PlusCircle,
  Users,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const employeeNav: NavItem[] = [
  { href: "/dashboard", label: "내 연차 현황", icon: LayoutDashboard },
  { href: "/requests", label: "내 신청 내역", icon: ClipboardList },
  { href: "/requests/new", label: "연차 신청", icon: PlusCircle },
];

export const adminNav: NavItem[] = [
  { href: "/admin", label: "전 직원 현황", icon: Users },
  { href: "/admin/registrations", label: "등록 현황", icon: ListChecks },
  { href: "/admin/calendar", label: "팀 캘린더", icon: CalendarDays },
];
