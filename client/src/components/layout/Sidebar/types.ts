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
  adminOnly?: boolean;
}

export interface NavSection {
  titleKey: string;
  icon: React.ElementType;
  items: NavItem[];
  adminOnly?: boolean;
  group?: NavGroupKey;
}

export interface NavGroup {
  groupKey: NavGroupKey;
  headerKey: string;
}
