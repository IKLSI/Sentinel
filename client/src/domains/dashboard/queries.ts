import { ROUTES_API } from "@/configs/api-routes.gen";
import { getQueryOptions, useGetQuery } from "@/domains/helpers";
import { DASHBOARD_QUERY_KEY } from "@/domains/dashboard/constants";
import type { DashboardStats } from "@/domains/dashboard/types";

export const dashboardQueryOptions = getQueryOptions<DashboardStats>(
  ROUTES_API.api.dashboard.stats.__path,
  DASHBOARD_QUERY_KEY,
);

export const useDashboard = () =>
  useGetQuery<DashboardStats>(
    ROUTES_API.api.dashboard.stats.__path,
    {},
    { queryKey: DASHBOARD_QUERY_KEY },
  );
