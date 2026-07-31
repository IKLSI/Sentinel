import type React from "react";
import { useMemo } from "react";
import Box from "@mui/material/Box";
import { useNavigate } from "@tanstack/react-router";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import AccountTreeOutlined from "@mui/icons-material/AccountTreeOutlined";
import { useT } from "@/contexts/I18nContext";
import { ROUTES } from "@/constants/routes";
import type { Project } from "@/domains/projects/types";
import { isCovered } from "@/formatters/coverage";
import {
  type DashPalette,
  HEALTH_CRITICAL_THRESHOLD,
  buildPanelSx,
  buildScrollSx,
  gradeMeta,
  scoreToGrade,
} from "@/features/dashboard/pages/DashboardPage/helpers";
import { HealthGauge } from "@/features/dashboard/pages/DashboardPage/components/HealthGauge";
import { ProjectRankRow } from "@/features/dashboard/pages/DashboardPage/components/ProjectRankRow";

interface Props {
  projects: Project[];
  palette: DashPalette;
}

export const ProjectsPanel: React.FC<Props> = ({ projects, palette }) => {
  const t = useT();
  const navigate = useNavigate();

  const { averageScore, belowCount, uncoveredCount } = useMemo(() => {
    const scores = projects
      .filter((p) => p.healthScore !== null)
      .map((p) => Math.max(0, Math.min(100, p.healthScore ?? 0)));
    const averageScore = scores.length
      ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
      : 0;
    const belowCount = scores.filter(
      (s) => s < HEALTH_CRITICAL_THRESHOLD,
    ).length;
    const uncoveredCount = projects.filter((p) => !isCovered(p)).length;
    return { averageScore, belowCount, uncoveredCount };
  }, [projects]);

  const belowText =
    belowCount === 0
      ? t("dashboard.park.below_none")
      : belowCount === 1
        ? t("dashboard.park.below_one")
        : t("dashboard.park.below_other", { count: belowCount });

  const uncoveredText =
    uncoveredCount > 0
      ? t("dashboard.park.uncovered", { count: uncoveredCount })
      : null;

  const gaugeColor = gradeMeta(scoreToGrade(averageScore)).color;

  return (
    <Box
      sx={{
        ...buildPanelSx(palette),
        gridColumn: "1",
        gridRow: "1 / 4",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          px: "16px",
          py: "12px",
          borderBottom: `1px solid ${palette.headerBorder}`,
          display: "flex",
          alignItems: "center",
          gap: "14px",
          flexShrink: 0,
        }}
      >
        <HealthGauge score={averageScore} color={gaugeColor} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              fontSize: "12.5px",
              fontWeight: 700,
              color: palette.textHeading,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {t("dashboard.park.title")}
          </Box>
          <Box sx={{ mt: "3px", fontSize: "10.5px", color: palette.textMuted }}>
            {belowText}
          </Box>
          {uncoveredText && (
            <Box
              sx={{ mt: "2px", fontSize: "10.5px", color: palette.textMuted2 }}
            >
              {uncoveredText}
            </Box>
          )}
        </Box>
        <Box
          component="button"
          onClick={() => navigate({ to: ROUTES.PROJECTS })}
          sx={{
            all: "unset",
            cursor: "pointer",
            color: palette.seeAll,
            fontSize: "11px",
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: "2px",
            transition: "color 120ms ease",
            "&:hover, &:focus-visible": {
              color: "var(--accent2)",
            },
          }}
        >
          {t("dashboard.see_all")}{" "}
          <ChevronRightOutlined sx={{ fontSize: 18 }} />
        </Box>
      </Box>
      <Box
        sx={{
          p: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          ...buildScrollSx(palette),
        }}
      >
        {projects.length === 0 ? (
          <Box
            className="empty-state"
            sx={{ flex: 1, padding: "24px !important" }}
          >
            <Box className="empty-state-icon">
              <AccountTreeOutlined sx={{ fontSize: 32 }} />
            </Box>
            <Box
              className="empty-state-title"
              sx={{ fontSize: "12px !important" }}
            >
              {t("dashboard.projects.empty_title")}
            </Box>
            <Box
              className="empty-state-subtitle"
              sx={{ fontSize: "11px !important" }}
            >
              {t("dashboard.projects.empty_subtitle")}
            </Box>
          </Box>
        ) : (
          projects.map((project) => (
            <ProjectRankRow
              key={project.id}
              project={project}
              palette={palette}
            />
          ))
        )}
      </Box>
    </Box>
  );
};
