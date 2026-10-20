import { createFileRoute } from "@tanstack/react-router";
import { queryClient } from "@/configs/queryClient";
import { DEFAULT_DASHBOARD_PERIOD } from "@/domains/dashboard/constants";
import { dashboardQueryOptions } from "@/domains/dashboard/queries";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: ({ context }) => {
    if (!context.auth.isAuthenticated) return;
    void queryClient.prefetchQuery(
      dashboardQueryOptions(DEFAULT_DASHBOARD_PERIOD),
    );
  },
  component: DashboardPage,
});
