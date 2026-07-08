import React from "react";
import Box from "@mui/material/Box";
import GppBadOutlined from "@mui/icons-material/GppBadOutlined";
import ReportProblemOutlined from "@mui/icons-material/ReportProblemOutlined";
import ConfirmationNumberOutlined from "@mui/icons-material/ConfirmationNumberOutlined";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { getDateFnsLocale } from "@/utils/dateFnsLocale";
import { useI18n } from "@/i18n/I18nContext";
import type { ProjectDto } from "@/features/techHealth/api/projects";
import { DashPalette, gradeMeta } from "../../helpers";

interface Props {
  project: ProjectDto;
  palette: DashPalette;
}

export const ProjectRankRow: React.FC<Props> = ({ project, palette }) => {
  const { t, culture } = useI18n();
  const navigate = useNavigate();

  const meta = gradeMeta(project.healthGrade);
  const scanned = Boolean(project.lastScanAt);
  const showCritical = scanned && project.criticalVulnerabilities > 0;

  const scanText = (() => {
    if (!project.lastScanAt) return t("dashboard.park.scan_none");
    const date = new Date(project.lastScanAt);
    if (Number.isNaN(date.getTime())) return t("dashboard.park.scan_none");
    return t("dashboard.park.scan_ago", {
      value: formatDistanceToNow(date, {
        addSuffix: true,
        locale: getDateFnsLocale(culture),
      }),
    });
  })();

  return (
    <Box
      component="button"
      onClick={() => navigate(`/projects/${project.id}`)}
      sx={{
        all: "unset",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        px: "12px",
        minHeight: "56px",
        borderRadius: "var(--r-md)",
        background: palette.rowBg,
        transition: "background 120ms ease, box-shadow 120ms ease",
        "&:hover": {
          background: palette.rowHoverBg,
          boxShadow: `0 0 0 1.5px ${palette.rowHoverRing}`,
        },
        "&:active": { background: palette.rowActiveBg },
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          display: "grid",
          placeItems: "center",
          fontFamily: "var(--font-mono)",
          fontSize: "17px",
          fontWeight: 800,
          color: meta.color,
          flexShrink: 0,
        }}
      >
        {(project.healthGrade ?? "A").toUpperCase()}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            fontSize: "13px",
            fontWeight: 700,
            color: palette.rowTitle,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {project.name}
        </Box>
        <Box
          sx={{
            mt: "2px",
            fontFamily: "var(--font-mono)",
            fontSize: "9.5px",
            color: palette.textMuted,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {scanText}
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          minWidth: 44,
          fontSize: "11px",
          fontWeight: 600,
          color: showCritical ? "var(--red)" : palette.vulnNeutral,
          fontVariantNumeric: "tabular-nums",
          flexShrink: 0,
        }}
      >
        <ReportProblemOutlined
          sx={{ fontSize: 14, color: showCritical ? "var(--red)" : palette.vulnIcon }}
        />
        <span>{scanned ? project.criticalVulnerabilities : "—"}</span>
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          minWidth: 44,
          fontSize: "11px",
          fontWeight: 600,
          color: palette.vulnNeutral,
          fontVariantNumeric: "tabular-nums",
          flexShrink: 0,
        }}
      >
        <GppBadOutlined sx={{ fontSize: 14, color: palette.vulnIcon }} />
        <span>{scanned ? project.totalVulnerabilities : "—"}</span>
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          minWidth: 44,
          fontSize: "11px",
          fontWeight: 600,
          color: palette.vulnNeutral,
          fontVariantNumeric: "tabular-nums",
          flexShrink: 0,
        }}
      >
        <ConfirmationNumberOutlined sx={{ fontSize: 14, color: palette.vulnIcon }} />
        <span>{scanned ? project.totalTickets : "—"}</span>
      </Box>
    </Box>
  );
};
