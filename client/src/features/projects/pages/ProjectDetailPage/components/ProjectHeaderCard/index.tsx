import type React from "react";
import Box from "@mui/material/Box";
import OpenInNewOutlined from "@mui/icons-material/OpenInNewOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import { GradeRing } from "@/components/ui/common/GradeRing";
import { LABEL_KEYS } from "@/components/ui/forms/ScanFrequencyPicker";
import { useI18n } from "@/contexts/I18nContext";
import type { ProjectHeader } from "@/domains/projects/types";
import { HeaderStats } from "@/features/projects/pages/ProjectDetailPage/components/ProjectHeaderCard/components/HeaderStats";
import {
  GRADE_VISUAL,
  UNTRACKED_SECTION,
  getGrade,
} from "@/features/projects/pages/ProjectsPage/helpers";
import { GRADE_NOT_AVAILABLE, isCovered } from "@/formatters/coverage";
import { formatShortDateTime } from "@/formatters/date";
import { ScanFrequency } from "@/enums";
import { PANEL_SX } from "@/helpers/cardSx";

interface Props {
  project: ProjectHeader;
  eolRuntimes: number;
  action?: React.ReactNode;
}

const META_TEXT_SX = { fontSize: "12px", color: "var(--muted)" } as const;

const BANNER_SX = {
  display: "flex",
  alignItems: "center",
  px: "24px",
  py: "10px",
  borderTop: "1px solid var(--border)",
} as const;

export const ProjectHeaderCard: React.FC<Props> = ({
  project,
  eolRuntimes,
  action,
}) => {
  const { t, culture } = useI18n();
  const covered = isCovered(project);
  const grade = covered ? getGrade(project.healthGrade) : UNTRACKED_SECTION;
  const score = covered ? project.healthScore : null;

  const freqLabel = (frequency: string) =>
    t(
      LABEL_KEYS[frequency as ScanFrequency] ??
        LABEL_KEYS[ScanFrequency.Manual],
    );

  const renderScanError = () => {
    if (!project.lastScanError) return null;

    return (
      <Box
        role="alert"
        sx={{
          ...BANNER_SX,
          gap: "8px",
          background: "var(--yellow-subtle)",
          color: "var(--text)",
          fontSize: "12px",
        }}
      >
        <WarningAmberOutlined sx={{ fontSize: 16, color: "var(--yellow)" }} />
        <Box component="span" sx={{ fontWeight: 600 }}>
          {t("tech_health.last_scan_error")}
        </Box>
        {t(project.lastScanError, {
          detail: project.lastScanErrorDetail ?? "",
        })}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        flexShrink: 0,
        ...PANEL_SX,
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
        <GradeRing
          size={48}
          value={project.healthScore ?? 0}
          color={GRADE_VISUAL[grade].iconColor}
          labelSx={{
            fontFamily: "var(--font-mono)",
            fontSize: covered ? "18px" : "11px",
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {covered ? grade : GRADE_NOT_AVAILABLE}
          {score != null && (
            <Box
              component="span"
              aria-label={t("tech_health.score_value", { score })}
              sx={{
                mt: "2px",
                fontSize: "9px",
                fontWeight: 600,
                color: "var(--muted)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {score}
            </Box>
          )}
        </GradeRing>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              mt: "3px",
            }}
          >
            {project.scanFrequency && (
              <Box component="span" sx={META_TEXT_SX}>
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
              <Box component="span" sx={META_TEXT_SX}>
                {formatShortDateTime(project.lastScanAt, culture)}
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
      {renderScanError()}
      <HeaderStats project={project} eolRuntimes={eolRuntimes} />
    </Box>
  );
};
