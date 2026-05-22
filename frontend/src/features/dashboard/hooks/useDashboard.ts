import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "../api/dashboard";

export const dashboardQueryKey = ["dashboard-stats"] as const;

export const useDashboard = (enabled = true) => {
  return useQuery({
    queryKey: dashboardQueryKey,
    queryFn: ({ signal }) => getDashboardStats(signal),
    enabled,
    staleTime: 30_000,
  });
};
