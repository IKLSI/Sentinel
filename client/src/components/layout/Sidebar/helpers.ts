import type { NavItem, NavSection } from "@/components/layout/Sidebar/types";

export function isItemActive(item: NavItem, pathname: string): boolean {
  if (item.activeFor?.test(pathname)) return true;
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export function isSectionActive(
  section: NavSection,
  pathname: string,
): boolean {
  return section.items.some((item) => isItemActive(item, pathname));
}

export function sectionKey(section: NavSection): string {
  return section.titleKey;
}
