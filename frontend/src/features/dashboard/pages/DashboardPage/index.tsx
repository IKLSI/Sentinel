import React, { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import ConfirmationNumberOutlined from "@mui/icons-material/ConfirmationNumberOutlined";
import CheckCircleOutlineOutlined from "@mui/icons-material/CheckCircleOutlineOutlined";
import PersonOffOutlined from "@mui/icons-material/PersonOffOutlined";
import ShieldOutlined from "@mui/icons-material/ShieldOutlined";
import { getDashboardStats } from "@/features/dashboard/api/dashboard";
import { getProjects } from "@/features/techHealth/api/projects";
import type { ProjectDto } from "@/features/techHealth/api/projects";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/i18n/I18nContext";
import { useTheme } from "@/store/ThemeContext";
import {
  EMPTY_STATS,
  PRIORITY_ORDER,
  StatsData,
  buildPalette,
} from "./helpers";
import { KpiCard } from "./components/KpiCard";
import { UrgentTicketsPanel } from "./components/UrgentTicketsPanel";
import { ActivityPanel } from "./components/ActivityPanel";
import { DistributionPanel } from "./components/DistributionPanel";
import { ProjectsPanel } from "./components/ProjectsPanel";

export const DashboardPage: React.FC = () => {
  const { showToast } = useToast();
  const t = useT();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const palette = useMemo(() => buildPalette(isDark), [isDark]);
  const [stats, setStats] = useState<StatsData>(EMPTY_STATS);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [statsRes, projectsRes] = await Promise.allSettled([
        getDashboardStats(),
        getProjects(),
      ]);
      if (!mounted) return;
      if (statsRes.status === "fulfilled") setStats(statsRes.value);
      else showToast(t("dashboard.toast.stats_load_error"), "error");
      if (projectsRes.status === "fulfilled") setProjects(projectsRes.value);
      else showToast(t("dashboard.toast.projects_load_error"), "error");
      setLoading(false);
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [showToast, t]);

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
    <Box sx={{ p: "16px 20px", height: "100vh", overflow: "hidden" }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
          gridTemplateRows: "auto 1.1fr 1fr",
          gap: "14px",
          height: "calc(100vh - 32px)",
          minHeight: "720px",
        }}
      >
        <Box sx={{ gridColumn: "span 3" }}>
          <KpiCard
            label={t("dashboard.kpi.open_tickets")}
            value={stats.openTickets}
            valueColor="var(--accent2)"
            icon={<ConfirmationNumberOutlined sx={{ fontSize: 17 }} />}
            delta={stats.openTicketsDelta}
            inverse
            palette={palette}
          />
        </Box>
        <Box sx={{ gridColumn: "span 3" }}>
          <KpiCard
            label={t("dashboard.kpi.resolved_per_month")}
            value={stats.resolvedThisMonth}
            valueColor="var(--green)"
            icon={<CheckCircleOutlineOutlined sx={{ fontSize: 17 }} />}
            delta={stats.resolvedThisMonthDelta}
            palette={palette}
          />
        </Box>
        <Box sx={{ gridColumn: "span 3" }}>
          <KpiCard
            label={t("dashboard.kpi.unassigned")}
            value={stats.unassignedOpenTickets}
            valueColor="var(--orange)"
            icon={<PersonOffOutlined sx={{ fontSize: 17 }} />}
            palette={palette}
          />
        </Box>
        <Box sx={{ gridColumn: "span 3" }}>
          <KpiCard
            label={t("dashboard.kpi.critical_vulns")}
            value={stats.criticalVulnerabilities}
            valueColor="var(--red)"
            icon={<ShieldOutlined sx={{ fontSize: 17 }} />}
            delta={stats.criticalVulnerabilities}
            badge
            palette={palette}
          />
        </Box>

        <UrgentTicketsPanel urgent={urgent} palette={palette} isDark={isDark} />

        <ActivityPanel activity={activity} palette={palette} />

        <DistributionPanel
          ticketsByStatus={stats.ticketsByStatus}
          ticketsByStatusColor={stats.ticketsByStatusColor ?? {}}
          palette={palette}
        />

        <ProjectsPanel projects={projects} palette={palette} isDark={isDark} />
      </Box>
    </Box>
  );
};
