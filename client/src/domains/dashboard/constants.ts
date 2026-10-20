import type { DashboardPeriod } from "@/domains/dashboard/types";

export const DASHBOARD_QUERY_KEY = ["dashboard-stats"] as const;

export const DEFAULT_DASHBOARD_PERIOD: DashboardPeriod = "Month";

export const dashboardQueryKey = (period: DashboardPeriod) =>
  [...DASHBOARD_QUERY_KEY, period] as const;
