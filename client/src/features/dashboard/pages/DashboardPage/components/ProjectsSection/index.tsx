import type React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import FolderOpenOutlined from "@mui/icons-material/FolderOpenOutlined";
import { useNavigate } from "@tanstack/react-router";
import { EmptyState } from "@/components/ui/common/feedback/EmptyState";
import { GradeRing } from "@/components/ui/common/GradeRing";
import { TEXT_ELLIPSIS_SX } from "@/constants/display";
import { useI18n } from "@/contexts/I18nContext";
import type { ProjectHealth } from "@/domains/dashboard/types";
import { CardLink } from "@/features/dashboard/pages/DashboardPage/components/CardLink";
import { DashboardCard } from "@/features/dashboard/pages/DashboardPage/components/DashboardCard";
import { BreakdownBars } from "@/features/dashboard/pages/DashboardPage/components/ProjectsSection/components/BreakdownBars";
import {
  DASHBOARD_ROW_SX,
  RING_SIZE,
  RING_THICKNESS,
} from "@/features/dashboard/pages/DashboardPage/constants";
import {
  gradeMeta,
  nextActionLabel,
} from "@/features/dashboard/pages/DashboardPage/helpers";

interface Props {
  projects: ProjectHealth[];
}

export const ProjectsSection: React.FC<Props> = ({ projects }) => {
  const { t } = useI18n();
  const navigate = useNavigate();

  const openTarget = (project: ProjectHealth) => {
    const { nextAction } = project;
    if (nextAction?.kind === "AssignTicket" && nextAction.ticketId) {
      navigate({ to: "/tickets/$id", params: { id: nextAction.ticketId } });
      return;
    }
    navigate({ to: "/projects/$id", params: { id: project.id } });
  };

  return (
    <DashboardCard
      title={t("dashboard.projects.title")}
      action={
        <CardLink
          label={t("dashboard.projects.see_all")}
          onClick={() => navigate({ to: "/projects" })}
        />
      }
    >
      {projects.length === 0 ? (
        <EmptyState
          icon={FolderOpenOutlined}
          title={t("dashboard.projects.empty_title")}
          subtitle={t("dashboard.projects.empty_subtitle")}
        />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {projects.map((project) => {
            const meta = gradeMeta(project.grade);
            const actionLabel = project.nextAction
              ? nextActionLabel(t, project.nextAction)
              : t("dashboard.projects.no_action");

            return (
              <ButtonBase
                key={project.id}
                onClick={() => openTarget(project)}
                sx={{
                  ...DASHBOARD_ROW_SX,
                  display: "grid",
                  gridTemplateColumns: "auto minmax(0, 1fr) auto",
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                <GradeRing
                  size={RING_SIZE}
                  thickness={RING_THICKNESS}
                  value={project.score ?? null}
                  color={meta.color}
                  trackColor="var(--s3)"
                  roundedCap
                  decorative
                  labelSx={{ fontWeight: 800, fontSize: "13px" }}
                >
                  {project.grade ?? "–"}
                </GradeRing>
                <Box sx={{ minWidth: 0 }}>
                  <Box
                    sx={{
                      fontSize: "12px",
                      fontWeight: 600,
                      lineHeight: 1.4,
                      letterSpacing: "-0.01em",
                      color: "var(--text)",
                      ...TEXT_ELLIPSIS_SX,
                    }}
                  >
                    {project.name}
                  </Box>
                  <Box
                    title={actionLabel}
                    sx={{
                      fontSize: "10px",
                      color: project.hasScanError
                        ? "var(--yellow)"
                        : "var(--muted2)",
                      mt: "2px",
                      ...TEXT_ELLIPSIS_SX,
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
                  <Box
                    sx={{ display: "flex", alignItems: "baseline", gap: "6px" }}
                  >
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
                      criticalVulnerabilityCount={
                        project.criticalVulnerabilityCount
                      }
                      highVulnerabilityCount={project.highVulnerabilityCount}
                      eolRuntimeCount={project.eolRuntimeCount}
                    />
                  )}
                </Box>
              </ButtonBase>
            );
          })}
        </Box>
      )}
    </DashboardCard>
  );
};
