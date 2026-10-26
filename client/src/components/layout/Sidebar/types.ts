import type React from "react";
import type { FileRouteTypes } from "@/routeTree.gen";

type NavPath = FileRouteTypes["to"];

type NavGroupKey = "nav" | "admin";

export interface NavItem {
  to: NavPath;
  icon: React.ElementType;
  labelKey: string;
  end?: boolean;
  activeFor?: RegExp;
}

export interface NavSection {
  titleKey: string;
  items: [NavItem];
  adminOnly?: boolean;
  group?: NavGroupKey;
}

export interface NavGroup {
  groupKey: NavGroupKey;
  headerKey: string;
}
