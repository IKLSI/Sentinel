import { ROUTES_API } from "@/configs/api-routes.gen";
import { useGetQuery } from "@/domains/helpers";
import {
  DASHBOARD_QUERY_KEY,
  DASHBOARD_STALE_TIME_MS,
} from "@/domains/dashboard/constants";
import type { DashboardStats } from "@/domains/dashboard/types";

export const useDashboard = (enabled = true) =>
  useGetQuery<DashboardStats>(
    ROUTES_API.api.dashboard.stats.__path,
    {},
    {
      queryKey: DASHBOARD_QUERY_KEY,
      enabled,
      staleTime: DASHBOARD_STALE_TIME_MS,
    },
  );
