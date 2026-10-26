import type { NavItem } from "@/components/layout/Sidebar/types";

export function isItemActive(item: NavItem, pathname: string): boolean {
  if (item.activeFor?.test(pathname)) return true;
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}
