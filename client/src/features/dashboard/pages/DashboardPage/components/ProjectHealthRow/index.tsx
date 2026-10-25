import type React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { useNavigate } from "@tanstack/react-router";
import { useI18n } from "@/contexts/I18nContext";
import type { ProjectHealth } from "@/domains/dashboard/types";
import { BreakdownBars } from "@/features/dashboard/pages/DashboardPage/components/BreakdownBars";
import { ScoreRing } from "@/features/dashboard/pages/DashboardPage/components/ScoreRing";
import {
  gradeMeta,
  nextActionLabel,
} from "@/features/dashboard/pages/DashboardPage/helpers";

interface Props {
  project: ProjectHealth;
}

const ellipsis = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
} as const;

export const ProjectHealthRow: React.FC<Props> = ({ project }) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const meta = gradeMeta(project.grade);
  const { nextAction } = project;
  const actionLabel = nextAction
    ? nextActionLabel(t, nextAction)
    : t("dashboard.projects.no_action");

  const openTarget = () => {
    if (nextAction?.kind === "AssignTicket" && nextAction.ticketId) {
      navigate({ to: "/tickets/$id", params: { id: nextAction.ticketId } });
      return;
    }
    navigate({ to: "/projects/$id", params: { id: project.id } });
  };

  return (
    <ButtonBase
      onClick={openTarget}
      sx={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "auto minmax(0, 1fr) auto",
        gap: "12px",
        alignItems: "center",
        textAlign: "left",
        minHeight: 48,
        px: "10px",
        borderRadius: "var(--r-md)",
        "&:hover": {
          background: "var(--accent-subtle)",
          boxShadow: "inset 0 0 0 1.5px var(--accent-border)",
        },
        "&.Mui-focusVisible": { outline: "2px solid var(--accent)" },
      }}
    >
      <ScoreRing
        score={project.score ?? null}
        grade={project.grade ?? null}
        color={meta.color}
      />
      <Box sx={{ minWidth: 0 }}>
        <Box
          sx={{
            fontSize: "12px",
            fontWeight: 600,
            lineHeight: 1.4,
            letterSpacing: "-0.01em",
            color: "var(--text)",
            ...ellipsis,
          }}
        >
          {project.name}
        </Box>
        <Box
          title={actionLabel}
          sx={{
            fontSize: "10px",
            color: project.hasScanError ? "var(--yellow)" : "var(--muted2)",
            mt: "2px",
            ...ellipsis,
          }}
        >
          {actionLabel}
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <Box
            sx={{
              fontSize: "14px",
              fontWeight: 750,
              letterSpacing: "-0.02em",
              lineHeight: 1,
              color: "var(--text)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {project.score ?? "–"}
          </Box>
        </Box>
        {project.score !== null && (
          <BreakdownBars
            criticalVulnerabilityCount={project.criticalVulnerabilityCount}
            highVulnerabilityCount={project.highVulnerabilityCount}
            eolRuntimeCount={project.eolRuntimeCount}
          />
        )}
      </Box>
    </ButtonBase>
  );
};
