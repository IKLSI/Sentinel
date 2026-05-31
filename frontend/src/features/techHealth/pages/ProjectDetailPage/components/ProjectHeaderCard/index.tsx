import React, { useState } from "react";
import Box from "@mui/material/Box";
import type { SvgIconComponent } from "@mui/icons-material";
import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import OpenInNewOutlined from "@mui/icons-material/OpenInNewOutlined";
import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import InventoryOutlined from "@mui/icons-material/InventoryOutlined";
import GppBadOutlined from "@mui/icons-material/GppBadOutlined";
import GppMaybeOutlined from "@mui/icons-material/GppMaybeOutlined";
import StorageOutlined from "@mui/icons-material/StorageOutlined";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import DangerousOutlined from "@mui/icons-material/DangerousOutlined";
import ReportOutlined from "@mui/icons-material/ReportOutlined";
import TrendingDownOutlined from "@mui/icons-material/TrendingDownOutlined";
import LockOpenOutlined from "@mui/icons-material/LockOpenOutlined";
import ThumbUpAltOutlined from "@mui/icons-material/ThumbUpAltOutlined";
import WorkspacePremiumOutlined from "@mui/icons-material/WorkspacePremiumOutlined";
import { useI18n } from "@/i18n/I18nContext";
import { ProjectDetailDto } from "@/features/techHealth/api/projects";

const GRADE_ICON: Record<string, { color: string; Icon: SvgIconComponent }> = {
  F: { color: "var(--red)", Icon: DangerousOutlined },
  E: { color: "var(--orange)", Icon: ReportOutlined },
  D: { color: "var(--yellow)", Icon: TrendingDownOutlined },
  C: { color: "color-mix(in srgb, var(--yellow) 70%, var(--orange) 30%)", Icon: LockOpenOutlined },
  B: { color: "var(--accent)", Icon: ThumbUpAltOutlined },
  A: { color: "var(--green)", Icon: WorkspacePremiumOutlined },
};

interface Props {
  project: ProjectDetailDto;
  eolRuntimes: number;
}

export const ProjectHeaderCard: React.FC<Props> = ({
  project,
  eolRuntimes,
}) => {
  const { t, culture } = useI18n();
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(project.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

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
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
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
                  {new Date(project.lastScanAt).toLocaleDateString(culture, {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Box>
              </Box>
            )}
            <Box
              component="button"
              onClick={handleCopyId}
              sx={{
                all: "unset", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "5px",
                background: "var(--s2)", border: "1px solid var(--border)",
                borderRadius: "var(--r-sm)", px: "8px", py: "3px",
                transition: "border-color 0.15s, color 0.15s",
                "&:hover": { borderColor: "var(--accent-border)", color: "var(--accent)" },
              }}
            >
              {copiedId
                ? <CheckOutlined sx={{ fontSize: 11, color: "var(--green)" }} />
                : <ContentCopyOutlined sx={{ fontSize: 11, color: "var(--muted)" }} />
              }
              <Box component="span" sx={{ fontSize: "11px", color: copiedId ? "var(--green)" : "var(--muted)", fontFamily: "monospace" }}>
                {project.id}
              </Box>
            </Box>
          </Box>
        </Box>

        {(() => {
          const cfg = GRADE_ICON[project.healthGrade ?? "F"] ?? GRADE_ICON["F"];
          return (
            <Box sx={{ color: cfg.color, flexShrink: 0 }}>
              <cfg.Icon sx={{ fontSize: 28 }} />
            </Box>
          );
        })()}
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
              dash: !project.lastScanAt,
            },
            {
              label: t("tech_health.stats.critical"),
              value: project.criticalVulnerabilities,
              icon: <GppBadOutlined sx={{ fontSize: 13 }} />,
              alert: project.criticalVulnerabilities > 0 ? "red" : null,
              dash: !project.lastScanAt || project.totalDependencies === 0,
            },
            {
              label: t("tech_health.stats.vulnerabilities"),
              value: project.totalVulnerabilities,
              icon: <GppMaybeOutlined sx={{ fontSize: 13 }} />,
              alert: project.totalVulnerabilities > 0 ? "orange" : null,
              dash: !project.lastScanAt || project.totalDependencies === 0,
            },
            {
              label: t("tech_health.stats.eol"),
              value: eolRuntimes,
              icon: <StorageOutlined sx={{ fontSize: 13 }} />,
              alert: eolRuntimes > 0 ? "red" : null,
              dash: !project.lastScanAt,
            },
          ]
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
              {s.dash ? "—" : s.value}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
