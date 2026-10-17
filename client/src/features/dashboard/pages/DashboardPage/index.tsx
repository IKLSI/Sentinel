import type React from "react";
import { Suspense, lazy, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useDashboard } from "@/domains/dashboard/queries";
import { useProjectsQuery } from "@/domains/projects/queries";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/contexts/I18nContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Theme } from "@/enums";
import { isCovered } from "@/formatters/coverage";
import {
  DASHBOARD_PANEL_ITEM_LIMIT,
  GRADE_ORDER,
  PRIORITY_ORDER,
  buildPalette,
} from "@/features/dashboard/pages/DashboardPage/helpers";
import { UrgentTicketsPanel } from "@/features/dashboard/pages/DashboardPage/components/UrgentTicketsPanel";
import { ActivityPanel } from "@/features/dashboard/pages/DashboardPage/components/ActivityPanel";
import { ProjectsPanel } from "@/features/dashboard/pages/DashboardPage/components/ProjectsPanel";

const vulnerabilityDiscoveryPanelModule = import(
  "@/features/dashboard/pages/DashboardPage/components/VulnerabilityDiscoveryPanel"
);

const VulnerabilityDiscoveryPanel = lazy(() =>
  vulnerabilityDiscoveryPanelModule.then((m) => ({
    default: m.VulnerabilityDiscoveryPanel,
  })),
);

export const DashboardPage: React.FC = () => {
  const { showToast } = useToast();
  const t = useT();
  const { theme } = useTheme();
  const isDark = theme === Theme.Dark;
  const palette = useMemo(() => buildPalette(isDark), [isDark]);

  const dashboardQuery = useDashboard();
  const projectsQuery = useProjectsQuery();

  const stats = dashboardQuery.data;
  const projects = useMemo(
    () =>
      (projectsQuery.data ?? []).filter(isCovered).sort((a, b) => {
        const ga = GRADE_ORDER[a.healthGrade?.toUpperCase() ?? ""] ?? 5;
        const gb = GRADE_ORDER[b.healthGrade?.toUpperCase() ?? ""] ?? 5;
        return (
          ga - gb ||
          (b.criticalVulnerabilities ?? 0) - (a.criticalVulnerabilities ?? 0) ||
          (b.totalVulnerabilities ?? 0) - (a.totalVulnerabilities ?? 0) ||
          (b.totalDependencies ?? 0) - (a.totalDependencies ?? 0)
        );
      }),
    [projectsQuery.data],
  );
  const loading = dashboardQuery.isLoading || projectsQuery.isLoading;

  useEffect(() => {
    if (dashboardQuery.error)
      showToast(t("dashboard.toast.stats_load_error"), "error");
  }, [dashboardQuery.error, showToast, t]);

  useEffect(() => {
    if (projectsQuery.error)
      showToast(t("dashboard.toast.projects_load_error"), "error");
  }, [projectsQuery.error, showToast, t]);

  const urgent = useMemo(
    () =>
      [...(stats?.urgentTickets ?? [])]
        .sort(
          (a, b) =>
            (PRIORITY_ORDER[b.priority ?? ""] ?? 0) -
            (PRIORITY_ORDER[a.priority ?? ""] ?? 0),
        )
        .slice(0, DASHBOARD_PANEL_ITEM_LIMIT),
    [stats?.urgentTickets],
  );
  const activity = (stats?.recentActivity ?? []).slice(
    0,
    DASHBOARD_PANEL_ITEM_LIMIT,
  );

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <CircularProgress
          size={36}
          thickness={3}
          sx={{ color: palette.loader }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: "20px", height: "100vh", overflow: "hidden" }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "6fr 5fr",
          gridTemplateRows: "1fr 1fr 200px",
          gap: "14px",
          height: "calc(100vh - 40px)",
          minHeight: "580px",
        }}
      >
        <ProjectsPanel projects={projects} palette={palette} />

        <UrgentTicketsPanel urgent={urgent} palette={palette} isDark={isDark} />

        <ActivityPanel activity={activity} palette={palette} />

        <Suspense fallback={null}>
          <VulnerabilityDiscoveryPanel
            data={stats?.vulnerabilitiesDetectedPerDay ?? []}
            palette={palette}
          />
        </Suspense>
      </Box>
    </Box>
  );
};
