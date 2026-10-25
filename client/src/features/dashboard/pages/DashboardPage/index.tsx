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
    <Box
      sx={{
        height: { xs: "auto", lg: "100vh" },
        minHeight: "100vh",
        overflowY: { xs: "auto", lg: "hidden" },
        boxSizing: "border-box",
        p: "16px 20px",
        display: "grid",
        gridTemplateRows: {
          xs: "auto",
          lg: "auto minmax(0, 1fr) minmax(0, 1fr)",
        },
        gap: "14px",
      }}
    >
      <ParkHero
        overview={stats.overview}
        vulnerabilityFlow={stats.vulnerabilityFlow}
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0, 2fr) minmax(0, 1fr)",
          },
          gap: "14px",
          minHeight: 0,
        }}
      >
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

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "repeat(3, minmax(0, 1fr))",
          },
          gap: "14px",
          minHeight: 0,
        }}
      >
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
