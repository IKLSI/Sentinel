import React from "react";
import Box from "@mui/material/Box";
import OpenInNewOutlined from "@mui/icons-material/OpenInNewOutlined";
import InventoryOutlined from "@mui/icons-material/InventoryOutlined";
import GppBadOutlined from "@mui/icons-material/GppBadOutlined";
import GppMaybeOutlined from "@mui/icons-material/GppMaybeOutlined";
import StorageOutlined from "@mui/icons-material/StorageOutlined";
import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import { useI18n } from "@/i18n/I18nContext";
import { ProjectDetailDto } from "@/features/techHealth/api/projects";
import { GRADE_VISUAL, getGrade } from "@/features/projects/pages/ProjectsPage/helpers";

interface Props {
  project: ProjectDetailDto;
  eolRuntimes: number;
}

export const ProjectHeaderCard: React.FC<Props> = ({
  project,
  eolRuntimes,
}) => {
  const { t, culture } = useI18n();

  const grade = getGrade(project.healthGrade);
  const gradeCfg = GRADE_VISUAL[grade];
  const { Icon: GradeIcon } = gradeCfg;

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
          background: `linear-gradient(135deg, color-mix(in srgb, ${gradeCfg.iconColor} 6%, transparent), transparent 60%)`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: gradeCfg.iconColor,
          }}
        >
          <GradeIcon sx={{ fontSize: 32 }} />
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
          </Box>
          <Box
            component="span"
            sx={{
              fontSize: "12px",
              fontWeight: 600,
              color: gradeCfg.iconColor,
              mt: "3px",
              display: "block",
            }}
          >
            {t(`projects.grade.${grade}.label`)}
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center", flexShrink: 0 }}>
          {project.scanFrequency && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "var(--s2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-sm)",
                px: "8px",
                py: "4px",
              }}
            >
              <RefreshOutlined sx={{ fontSize: 12, color: "var(--muted)" }} />
              <Box component="span" sx={{ fontSize: "11px", color: "var(--muted)" }}>
                {freqLabel(project.scanFrequency)}
              </Box>
            </Box>
          )}
          {project.lastScanAt && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "var(--s2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-sm)",
                px: "8px",
                py: "4px",
              }}
            >
              <AccessTimeOutlined sx={{ fontSize: 12, color: "var(--muted)" }} />
              <Box component="span" sx={{ fontSize: "11px", color: "var(--muted)" }}>
                {new Date(project.lastScanAt).toLocaleDateString(culture, {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          borderTop: "1px solid var(--border)",
        }}
      >
        {(
          [
            {
              label: t("tech_health.stats.dependencies"),
              value: project.totalDependencies,
              icon: <InventoryOutlined sx={{ fontSize: 15 }} />,
              alert: null,
              dash: !project.lastScanAt,
            },
            {
              label: t("tech_health.stats.critical"),
              value: project.criticalVulnerabilities,
              icon: <GppBadOutlined sx={{ fontSize: 15 }} />,
              alert: project.criticalVulnerabilities > 0 ? "red" : null,
              dash: !project.lastScanAt || project.totalDependencies === 0,
            },
            {
              label: t("tech_health.stats.vulnerabilities"),
              value: project.totalVulnerabilities,
              icon: <GppMaybeOutlined sx={{ fontSize: 15 }} />,
              alert: project.totalVulnerabilities > 0 ? "orange" : null,
              dash: !project.lastScanAt || project.totalDependencies === 0,
            },
            {
              label: t("tech_health.stats.eol"),
              value: eolRuntimes,
              icon: <StorageOutlined sx={{ fontSize: 15 }} />,
              alert: eolRuntimes > 0 ? "red" : null,
              dash: !project.lastScanAt,
            },
          ]
        ).map((s, i) => {
          const accent =
            s.alert === "red" ? "var(--red)" : s.alert === "orange" ? "var(--orange)" : "var(--muted)";
          return (
            <Box
              key={i}
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
