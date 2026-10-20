import { ROUTES_API } from "@/configs/api-routes.gen";
import { getQueryOptions, useGetQuery } from "@/domains/helpers";
import { dashboardQueryKey } from "@/domains/dashboard/constants";
import type {
  DashboardPeriod,
  DashboardStats,
} from "@/domains/dashboard/types";

export const dashboardQueryOptions = (period: DashboardPeriod) =>
  getQueryOptions<DashboardStats>(
    ROUTES_API.api.dashboard.stats.__path,
    dashboardQueryKey(period),
    { period },
  );

export const useDashboard = (period: DashboardPeriod) =>
  useGetQuery<DashboardStats>(
    ROUTES_API.api.dashboard.stats.__path,
    { period },
    { queryKey: dashboardQueryKey(period) },
  );
