import type React from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import OpenInNewOutlined from "@mui/icons-material/OpenInNewOutlined";
import InventoryOutlined from "@mui/icons-material/InventoryOutlined";
import GppBadOutlined from "@mui/icons-material/GppBadOutlined";
import GppMaybeOutlined from "@mui/icons-material/GppMaybeOutlined";
import StorageOutlined from "@mui/icons-material/StorageOutlined";
import { useI18n } from "@/i18n/I18nContext";
import type { ProjectDetailDto } from "@/features/techHealth/api/projects";
import {
  GRADE_VISUAL,
  UNTRACKED_SECTION,
  getGrade,
} from "@/features/projects/pages/ProjectsPage/helpers";
import {
  GRADE_NOT_AVAILABLE,
  coverageReasonKey,
  isCovered,
} from "@/utils/coverage";

interface Props {
  project: ProjectDetailDto;
  eolRuntimes: number;
  action?: React.ReactNode;
}

export const ProjectHeaderCard: React.FC<Props> = ({
  project,
  eolRuntimes,
  action,
}) => {
  const { t, culture } = useI18n();

  const covered = isCovered(project);
  const grade = covered ? getGrade(project.healthGrade) : UNTRACKED_SECTION;
  const gradeCfg = GRADE_VISUAL[grade];

  const freqLabel = (f: string) => {
    if (f === "Daily") return t("tech_health.scan_frequency.daily");
    if (f === "Weekly") return t("tech_health.scan_frequency.weekly");
    if (f === "Monthly") return t("tech_health.scan_frequency.monthly");
    return t("tech_health.scan_frequency.manual");
  };

  return (
    <Box
      sx={{
        flexShrink: 0,
        background: "var(--s1)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
        mb: "16px",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          p: "20px 24px",
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: "48px",
            height: "48px",
            flexShrink: 0,
          }}
        >
          <CircularProgress
            variant="determinate"
            value={100}
            size={48}
            thickness={2.5}
            sx={{ position: "absolute", inset: 0, color: "var(--border)" }}
          />
          <CircularProgress
            variant="determinate"
            value={project.healthScore ?? 0}
            size={48}
            thickness={2.5}
            sx={{ position: "absolute", inset: 0, color: gradeCfg.iconColor }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: gradeCfg.iconColor,
              fontFamily: "var(--font-mono)",
              fontSize: covered ? "18px" : "11px",
              fontWeight: 700,
            }}
          >
            {covered ? grade : GRADE_NOT_AVAILABLE}
          </Box>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Box
              sx={{
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--text)",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              {project.name}
            </Box>
            {project.repositoryUrl && (
              <Box
                component="a"
                href={project.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={project.repositoryUrl}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  color: "var(--muted)",
                  textDecoration: "none",
                  transition: "color 0.12s",
                  "&:hover": { color: "var(--accent)" },
                }}
              >
                <OpenInNewOutlined sx={{ fontSize: 15 }} />
              </Box>
            )}
            {!covered && (
              <Box
                component="span"
                sx={{
                  px: "8px",
                  py: "2px",
                  borderRadius: "var(--r-xs)",
                  background: "var(--s3)",
                  color: "var(--muted2)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                {t("tech_health.coverage.badge")} ·{" "}
                {t(coverageReasonKey(project))}
              </Box>
            )}
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              mt: "3px",
            }}
          >
            {project.scanFrequency && (
              <Box
                component="span"
                sx={{ fontSize: "12px", color: "var(--muted)" }}
              >
                {freqLabel(project.scanFrequency)}
              </Box>
            )}
            {project.scanFrequency && project.lastScanAt && (
              <Box
                component="span"
                sx={{ fontSize: "12px", color: "var(--muted2)" }}
              >
                ·
              </Box>
            )}
            {project.lastScanAt && (
              <Box
                component="span"
                sx={{ fontSize: "12px", color: "var(--muted)" }}
              >
                {new Date(project.lastScanAt).toLocaleDateString(culture, {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Box>
            )}
          </Box>
        </Box>

        {action && (
          <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
            {action}
          </Box>
        )}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          borderTop: "1px solid var(--border)",
        }}
      >
        {[
          {
            label: t("tech_health.stats.dependencies"),
            value: project.totalDependencies,
            icon: <InventoryOutlined sx={{ fontSize: 15 }} />,
            alert: null,
            dash: !covered,
          },
          {
            label: t("tech_health.stats.critical"),
            value: project.criticalVulnerabilities,
            icon: <GppBadOutlined sx={{ fontSize: 15 }} />,
            alert: project.criticalVulnerabilities > 0 ? "red" : null,
            dash: !covered,
          },
          {
            label: t("tech_health.stats.vulnerabilities"),
            value: project.totalVulnerabilities,
            icon: <GppMaybeOutlined sx={{ fontSize: 15 }} />,
            alert: project.totalVulnerabilities > 0 ? "orange" : null,
            dash: !covered,
          },
          {
            label: t("tech_health.stats.eol"),
            value: eolRuntimes,
            icon: <StorageOutlined sx={{ fontSize: 15 }} />,
            alert: eolRuntimes > 0 ? "red" : null,
            dash: !covered,
          },
        ].map((s, i) => {
          const accent =
            s.alert === "red"
              ? "var(--red)"
              : s.alert === "orange"
                ? "var(--orange)"
                : "var(--muted)";
          return (
            <Box
              key={s.label}
              sx={{
                p: "14px 20px",
                borderRight: i < 3 ? "1px solid var(--border)" : "none",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: accent,
                  mb: "8px",
                }}
              >
                {s.icon}
                <Box
                  component="span"
                  sx={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "9px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--muted)",
                  }}
                >
                  {s.label}
                </Box>
              </Box>
              <Box
                sx={{
                  fontSize: "28px",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  color:
                    s.alert === "red"
                      ? "var(--red)"
                      : s.alert === "orange"
                        ? "var(--orange)"
                        : "var(--text)",
                }}
              >
                {s.dash ? "—" : s.value}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
