import type React from "react";
import { Suspense, lazy } from "react";
import Box from "@mui/material/Box";
import { useI18n } from "@/contexts/I18nContext";
import { useDashboard } from "@/domains/dashboard/queries";
import { useQueryErrorToast } from "@/hooks/useQueryErrorToast";
import { LoadErrorState } from "@/components/ui/common/LoadErrorState";
import { ChartCardSkeleton } from "@/features/dashboard/pages/DashboardPage/components/ChartCardSkeleton";
import { DashboardSkeleton } from "@/features/dashboard/pages/DashboardPage/components/DashboardSkeleton";
import { ParkHero } from "@/features/dashboard/pages/DashboardPage/components/ParkHero";
import { ProjectsSection } from "@/features/dashboard/pages/DashboardPage/components/ProjectsSection";
import { RecentActivityCard } from "@/features/dashboard/pages/DashboardPage/components/RecentActivityCard";
import { UrgentTicketsCard } from "@/features/dashboard/pages/DashboardPage/components/UrgentTicketsCard";
import {
  DASHBOARD_BOTTOM_ROW_SX,
  DASHBOARD_LAYOUT_SX,
  DASHBOARD_TOP_ROW_SX,
} from "@/features/dashboard/pages/DashboardPage/constants";

const ScoreTrendCard = lazy(() =>
  import(
    "@/features/dashboard/pages/DashboardPage/components/ScoreTrendCard"
  ).then((m) => ({ default: m.ScoreTrendCard })),
);

const VulnerabilityFlowCard = lazy(() =>
  import(
    "@/features/dashboard/pages/DashboardPage/components/VulnerabilityFlowCard"
  ).then((m) => ({ default: m.VulnerabilityFlowCard })),
);

export const DashboardPage: React.FC = () => {
  const { t } = useI18n();
  const { data: stats, error, isLoading, isFetching, refetch } = useDashboard();

  useQueryErrorToast(!!error, "dashboard.toast.stats_load_error");

  if (isLoading) return <DashboardSkeleton />;

  if (!stats) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <LoadErrorState onRetry={() => refetch()} retrying={isFetching} />
      </Box>
    );
  }

  return (
    <Box sx={DASHBOARD_LAYOUT_SX}>
      <ParkHero
        overview={stats.overview}
        vulnerabilityFlow={stats.vulnerabilityFlow}
      />

      <Box sx={DASHBOARD_TOP_ROW_SX}>
        <Suspense
          fallback={
            <ChartCardSkeleton
              title={t("dashboard.trend.title")}
              variant="trend"
            />
          }
        >
          <ScoreTrendCard history={stats.scoreHistory} />
        </Suspense>
        <UrgentTicketsCard tickets={stats.urgentTickets} />
      </Box>

      <Box sx={DASHBOARD_BOTTOM_ROW_SX}>
        <ProjectsSection projects={stats.projects} />
        <Suspense
          fallback={
            <ChartCardSkeleton
              title={t("dashboard.flow.title")}
              variant="flow"
            />
          }
        >
          <VulnerabilityFlowCard flow={stats.vulnerabilityFlow} />
        </Suspense>
        <RecentActivityCard activity={stats.recentActivity} />
      </Box>
    </Box>
  );
};
