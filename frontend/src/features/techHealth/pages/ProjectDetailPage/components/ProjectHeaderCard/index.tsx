import React from "react";
import Box from "@mui/material/Box";
import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import OpenInNewOutlined from "@mui/icons-material/OpenInNewOutlined";
import InventoryOutlined from "@mui/icons-material/InventoryOutlined";
import GppBadOutlined from "@mui/icons-material/GppBadOutlined";
import StorageOutlined from "@mui/icons-material/StorageOutlined";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import { HealthScoreCircle } from "@/components/HealthScoreCircle";
import { useT } from "@/i18n/I18nContext";
import { ProjectDetailDto } from "@/features/techHealth/api/projects";

interface Props {
  project: ProjectDetailDto;
  depsToUpdate: number;
  eolRuntimes: number;
}

export const ProjectHeaderCard: React.FC<Props> = ({
  project,
  depsToUpdate,
  eolRuntimes,
}) => {
  const t = useT();
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
          gap: "20px",
          p: "20px 24px 20px 28px",
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              mb: "10px",
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
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {project.scanFrequency && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "var(--s2)",
                  border: "1px solid var(--border)",
                  borderRadius: 'var(--r-sm)',
                  px: "8px",
                  py: "3px",
                }}
              >
                <RefreshOutlined sx={{ fontSize: 11, color: "var(--muted)" }} />
                <Box
                  component="span"
                  sx={{ fontSize: "11px", color: "var(--muted)" }}
                >
                  {project.scanFrequency === "Daily"
                    ? t("tech_health.scan_frequency.daily")
                    : t("tech_health.scan_frequency.weekly")}
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
                  borderRadius: 'var(--r-sm)',
                  px: "8px",
                  py: "3px",
                }}
              >
                <AccessTimeOutlined
                  sx={{ fontSize: 11, color: "var(--muted)" }}
                />
                <Box
                  component="span"
                  sx={{ fontSize: "11px", color: "var(--muted)" }}
                >
                  {new Date(project.lastScanAt).toLocaleDateString("fr-FR", {
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

        <HealthScoreCircle
          score={project.healthScore}
          grade={project.healthGrade as "A" | "B" | "C" | "D" | "F"}
          size={64}
        />
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
              icon: <InventoryOutlined sx={{ fontSize: 13 }} />,
              alert: null,
            },
            {
              label: t("tech_health.stats.to_update"),
              value: depsToUpdate,
              icon: <RefreshOutlined sx={{ fontSize: 13 }} />,
              alert: depsToUpdate > 0 ? "orange" : null,
            },
            {
              label: t("tech_health.stats.critical"),
              value: project.criticalVulnerabilities,
              icon: <GppBadOutlined sx={{ fontSize: 13 }} />,
              alert: project.criticalVulnerabilities > 0 ? "red" : null,
            },
            {
              label: t("tech_health.stats.eol"),
              value: eolRuntimes,
              icon: <StorageOutlined sx={{ fontSize: 13 }} />,
              alert: eolRuntimes > 0 ? "red" : null,
            },
          ] as const
        ).map((s, i) => (
          <Box
            key={i}
            sx={{
              p: "14px 20px",
              borderRight: i < 3 ? "1px solid var(--border)" : "none",
              background: "transparent",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                color: "var(--muted)",
                mb: "6px",
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
              {s.value}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
