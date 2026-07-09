import type React from "react";
import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import {
  useDashboard,
  dashboardQueryKey,
} from "@/features/dashboard/hooks/useDashboard";
import {
  useProjects,
  projectsQueryKey,
} from "@/features/techHealth/hooks/useProjects";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/i18n/I18nContext";
import { useTheme } from "@/store/ThemeContext";
import { Theme } from "@/types/enums";
import {
  EMPTY_STATS,
  GRADE_ORDER,
  PRIORITY_ORDER,
  type StatsData,
  buildPalette,
} from "./helpers";
import { UrgentTicketsPanel } from "./components/UrgentTicketsPanel";
import { ActivityPanel } from "./components/ActivityPanel";
import { VulnerabilityDiscoveryPanel } from "./components/VulnerabilityDiscoveryPanel";
import { ProjectsPanel } from "./components/ProjectsPanel";

export const DashboardPage: React.FC = () => {
  const { showToast } = useToast();
  const t = useT();
  const { theme } = useTheme();
  const isDark = theme === Theme.Dark;
  const palette = useMemo(() => buildPalette(isDark), [isDark]);
  const queryClient = useQueryClient();

  const dashboardQuery = useDashboard();
  const projectsQuery = useProjects();

  const stats: StatsData = (dashboardQuery.data as StatsData) ?? EMPTY_STATS;
  const projects = useMemo(
    () =>
      [...(projectsQuery.data ?? [])].sort((a, b) => {
        const ga = GRADE_ORDER[a.healthGrade?.toUpperCase() ?? "A"] ?? 5;
        const gb = GRADE_ORDER[b.healthGrade?.toUpperCase() ?? "A"] ?? 5;
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

  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
      queryClient.invalidateQueries({ queryKey: projectsQueryKey });
    };
    window.addEventListener("dashboard:refresh", handler);
    return () => window.removeEventListener("dashboard:refresh", handler);
  }, [queryClient]);

  const urgent = useMemo(
    () =>
      [...stats.urgentTickets]
        .sort(
          (a, b) =>
            (PRIORITY_ORDER[b.priority] ?? 0) -
            (PRIORITY_ORDER[a.priority] ?? 0),
        )
        .slice(0, 8),
    [stats.urgentTickets],
  );
  const activity = stats.recentActivity.slice(0, 8);

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

        <VulnerabilityDiscoveryPanel
          data={stats.vulnerabilitiesDetectedPerDay}
          palette={palette}
        />
      </Box>
    </Box>
  );
};
