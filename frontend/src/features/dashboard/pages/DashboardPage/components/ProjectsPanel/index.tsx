import React, { useMemo } from "react";
import Box from "@mui/material/Box";
import { useNavigate } from "react-router-dom";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import AccountTreeOutlined from "@mui/icons-material/AccountTreeOutlined";
import { useT } from "@/i18n/I18nContext";
import { ROUTES } from "@/constants/routes";
import type { ProjectDto } from "@/features/techHealth/api/projects";
import {
  DashPalette,
  HEALTH_CRITICAL_THRESHOLD,
  buildPanelSx,
  buildScrollSx,
  gradeMeta,
  scoreToGrade,
} from "../../helpers";
import { HealthGauge } from "../HealthGauge";
import { ProjectRankRow } from "../ProjectRankRow";

interface Props {
  projects: ProjectDto[];
  palette: DashPalette;
}

export const ProjectsPanel: React.FC<Props> = ({ projects, palette }) => {
  const t = useT();
  const navigate = useNavigate();

  const { averageScore, belowCount } = useMemo(() => {
    const scores = projects.map((p) => Math.max(0, Math.min(100, p.healthScore ?? 0)));
    const averageScore = scores.length
      ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
      : 0;
    const belowCount = scores.filter((s) => s < HEALTH_CRITICAL_THRESHOLD).length;
    return { averageScore, belowCount };
  }, [projects]);

  const belowText =
    belowCount === 0
      ? t("dashboard.park.below_none")
      : belowCount === 1
        ? t("dashboard.park.below_one")
        : t("dashboard.park.below_other", { count: belowCount });

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
        </Box>
        <Box
          component="button"
          onClick={() => navigate(ROUTES.PROJECTS)}
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
          <Box className="empty-state" sx={{ flex: 1, padding: "24px !important" }}>
            <Box className="empty-state-icon">
              <AccountTreeOutlined sx={{ fontSize: 32 }} />
            </Box>
            <Box className="empty-state-title" sx={{ fontSize: "12px !important" }}>
              {t("dashboard.projects.empty_title")}
            </Box>
            <Box className="empty-state-subtitle" sx={{ fontSize: "11px !important" }}>
              {t("dashboard.projects.empty_subtitle")}
            </Box>
          </Box>
        ) : (
          projects.map((project) => (
            <ProjectRankRow key={project.id} project={project} palette={palette} />
          ))
        )}
      </Box>
    </Box>
  );
};
