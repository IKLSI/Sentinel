import type React from "react";
import { Suspense, lazy } from "react";
import Box from "@mui/material/Box";
import { useI18n } from "@/contexts/I18nContext";
import { ChartCardSkeleton } from "@/features/dashboard/pages/DashboardPage/components/ChartCardSkeleton";
import { ParkHero } from "@/features/dashboard/pages/DashboardPage/components/ParkHero";
import { ProjectsSection } from "@/features/dashboard/pages/DashboardPage/components/ProjectsSection";
import { RecentActivityCard } from "@/features/dashboard/pages/DashboardPage/components/RecentActivityCard";
import { UrgentTicketsCard } from "@/features/dashboard/pages/DashboardPage/components/UrgentTicketsCard";
import { DEMO_DASHBOARD } from "@/features/landing/demo/fixtures/dashboard";

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

export const DemoDashboard: React.FC = () => {
  const { t } = useI18n();
  const stats = DEMO_DASHBOARD;

  return (
    <Box
      sx={{
        height: "100%",
        boxSizing: "border-box",
        p: "16px 20px",
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr) minmax(0, 1fr)",
        gap: "14px",
      }}
    >
      <ParkHero overview={stats.overview} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
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
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
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
