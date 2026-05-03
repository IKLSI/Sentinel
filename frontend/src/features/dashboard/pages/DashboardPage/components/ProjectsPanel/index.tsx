import React from "react";
import Box from "@mui/material/Box";
import { useNavigate } from "react-router-dom";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import ConfirmationNumberOutlined from "@mui/icons-material/ConfirmationNumberOutlined";
import ShieldOutlined from "@mui/icons-material/ShieldOutlined";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useT } from "@/i18n/I18nContext";
import type { ProjectDto } from "@/features/techHealth/api/projects";
import {
  DashPalette,
  buildPanelSx,
  buildScrollSx,
  projectTone,
  repoPath,
} from "../../helpers";

interface Props {
  projects: ProjectDto[];
  palette: DashPalette;
  isDark: boolean;
}

export const ProjectsPanel: React.FC<Props> = ({
  projects,
  palette,
  isDark,
}) => {
  const t = useT();
  const navigate = useNavigate();

  const projectRows = projects.slice(0, 4);

  const projectsSyncText = (() => {
    const latestScan = projects
      .map((p) => p.lastScanAt)
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    if (!latestScan) return t("dashboard.projects_sync.none");
    return t("dashboard.projects_sync.last", {
      value: formatDistanceToNow(latestScan, { addSuffix: true, locale: fr }),
    });
  })();

  return (
    <Box
      sx={{
        ...buildPanelSx(palette),
        gridColumn: "span 8",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          px: "18px",
          py: "12px",
          borderBottom: `1px solid ${palette.headerBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Box
            sx={{
              fontSize: "15px",
              lineHeight: 1.1,
              fontWeight: 700,
              color: palette.textPrimary,
              letterSpacing: "-0.02em",
            }}
          >
            {t("dashboard.projects.title")}
          </Box>
          <Box
            sx={{ mt: "6px", color: palette.textSecondary, fontSize: "11px" }}
          >
            {projectsSyncText}
          </Box>
        </Box>
        <Box
          component="button"
          onClick={() => navigate("/projects")}
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
            textDecoration: "none",
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
          p: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          ...buildScrollSx(palette),
        }}
      >
        {projectRows.map((p) => {
          const tone = projectTone(p, isDark);
          return (
            <Box
              key={p.id}
              component="button"
              onClick={() => navigate(`/projects/${p.id}`)}
              sx={{
                all: "unset",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                minHeight: "48px",
                px: "10px",
                gap: "10px",
                borderRadius: 'var(--r-md)',
                background: palette.rowBg,
                transition: "background 120ms ease, box-shadow 120ms ease",
                "&:hover": {
                  background: palette.rowHoverBg,
                  boxShadow: `0 0 0 1.5px ${palette.rowHoverRing}`,
                },
                "&:active": { background: palette.rowActiveBg },
              }}
            >
              <tone.Icon
                sx={{ fontSize: 18, color: tone.color, flexShrink: 0 }}
              />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box
                  sx={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: palette.rowTitle,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.name}
                </Box>
                <Box
                  sx={{
                    mt: "2px",
                    fontSize: "10px",
                    fontFamily: "var(--font-mono)",
                    color: palette.textMuted2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {repoPath(p.repositoryUrl, p.repositoryType)}
                </Box>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexShrink: 0,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: palette.vulnNeutral,
                  }}
                >
                  <ConfirmationNumberOutlined
                    sx={{ fontSize: 14, color: palette.vulnIcon }}
                  />
                  <span>{p.totalTickets}</span>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11px",
                    fontWeight: 600,
                    color:
                      p.criticalVulnerabilities > 0
                        ? palette.vulnDanger
                        : palette.vulnNeutral,
                  }}
                >
                  <ShieldOutlined sx={{ fontSize: 14 }} />
                  <span>{p.criticalVulnerabilities}</span>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
