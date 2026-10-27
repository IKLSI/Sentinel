import React from "react";
import Box from "@mui/material/Box";
import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { RowActions } from "@/components/ui/common/table/RowActions";
import { ScanProgressBar } from "@/components/ui/common/feedback/ScanProgressBar";
import { gradeToneOf } from "@/constants/grades";
import { TEXT_ELLIPSIS_SX } from "@/constants/display";
import { useT } from "@/contexts/I18nContext";
import type {
  ProjectSearchMatch,
  ProjectSummary,
  ScanProgress,
} from "@/domains/projects/types";
import { DependencyStatus } from "@/enums";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { spin } from "@/styles/keyframes";

interface Props {
  project: ProjectSummary;
  onEdit: (project: ProjectSummary) => void;
  onDelete: (project: ProjectSummary) => void;
  onScan: (id: string) => void;
  isScanning: boolean;
  dependencyMatch?: ProjectSearchMatch;
  scanProgress?: ScanProgress;
}

const CELL_SX = {
  padding: "6px 12px",
  borderBottom: "1px solid var(--border)",
} as const;

const renderMetricCell = (
  value: React.ReactNode,
  emphasized: boolean,
  accent: string | undefined,
) => (
  <Box component="td" sx={{ ...CELL_SX, textAlign: "center" }}>
    <Box
      sx={{
        color: emphasized ? accent : "var(--muted2)",
        fontWeight: emphasized ? 700 : 500,
        fontSize: "13px",
        lineHeight: 1.25,
        fontFamily: "var(--font-mono)",
      }}
    >
      {value}
    </Box>
  </Box>
);

const stopAndRun = (action: () => void) => (event: React.MouseEvent) => {
  event.stopPropagation();
  action();
};

export const ProjectRow: React.FC<Props> = React.memo(
  ({
    project,
    onEdit,
    onDelete,
    onScan,
    isScanning,
    dependencyMatch,
    scanProgress,
  }) => {
    const t = useT();
    const isAdmin = useIsAdmin();
    const navigate = useNavigate();
    const router = useRouter();
    const ticketCount = project.totalTickets;
    const unscanned = !project.lastScanAt || project.totalDependencies === 0;

    const renderDependencyMatches = (match: ProjectSearchMatch) => {
      const hiddenCount =
        match.dependencyMatchCount - match.dependencies.length;
      return (
        <Box
          component="span"
          sx={{
            display: "inline-flex",
            gap: "8px",
            minWidth: 0,
            overflow: "hidden",
            fontFamily: "var(--font-mono)",
          }}
        >
          {match.dependencies.map((dependency) => (
            <Box
              key={`${dependency.name}@${dependency.version}`}
              component="span"
              sx={{
                whiteSpace: "nowrap",
                color:
                  dependency.status === DependencyStatus.Vulnerable
                    ? "var(--red)"
                    : "var(--text-secondary)",
              }}
            >
              {dependency.name}@{dependency.version}
            </Box>
          ))}
          {hiddenCount > 0 &&
            t("projects.search.more_matches", { count: hiddenCount })}
        </Box>
      );
    };

    const renderSubtitle = () => {
      if (scanProgress)
        return <ScanProgressBar progress={scanProgress} width={84} />;
      if (dependencyMatch && dependencyMatch.dependencies.length > 0)
        return renderDependencyMatches(dependencyMatch);
      if (!project.lastScanAt) return "—";
      const unit =
        project.totalDependencies > 1
          ? t("projects.dependencies_plural")
          : t("projects.dependency_singular");
      return `${project.totalDependencies} ${unit}`;
    };

    return (
      <Box
        component="tr"
        onClick={() =>
          navigate({ to: "/projects/$id", params: { id: project.id } })
        }
        onMouseEnter={() =>
          void router.preloadRoute({
            to: "/projects/$id",
            params: { id: project.id },
          })
        }
        sx={{
          cursor: "pointer",
          position: "relative",
          transition: "background 0.12s ease",
          "& td": {
            transition: "background 0.12s ease, border-color 0.12s ease",
            verticalAlign: "middle",
          },
          "&:hover td": { background: "var(--s2)" },
          "&:hover .row-actions": { opacity: "1 !important" },
        }}
      >
        <Box component="td" sx={{ ...CELL_SX, fontSize: "12px" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              minWidth: 0,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Box
                component={Link}
                to={`/projects/${project.id}`}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                sx={{
                  display: "block",
                  textDecoration: "none",
                  fontFamily: "inherit",
                  fontWeight: 700,
                  color: "var(--text)",
                  fontSize: "13px",
                  lineHeight: 1.25,
                  letterSpacing: "-0.02em",
                  ...TEXT_ELLIPSIS_SX,
                  "&:hover": { textDecoration: "none" },
                }}
              >
                {project.name}
              </Box>
              <Box
                sx={{
                  mt: "3px",
                  color: "var(--muted2)",
                  fontSize: "11px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap",
                }}
              >
                {renderSubtitle()}
              </Box>
            </Box>
          </Box>
        </Box>

        {renderMetricCell(
          project.healthScore ?? "—",
          project.healthScore !== null,
          gradeToneOf(project.healthGrade)?.color,
        )}
        {renderMetricCell(
          unscanned ? "—" : project.totalVulnerabilities,
          !unscanned && project.totalVulnerabilities !== 0,
          "var(--orange)",
        )}
        {renderMetricCell(
          unscanned ? "—" : project.criticalVulnerabilities,
          !unscanned && project.criticalVulnerabilities !== 0,
          "var(--red)",
        )}
        {renderMetricCell(ticketCount, ticketCount > 0, "var(--text)")}

        <Box
          component="td"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          sx={{
            padding: "6px 20px 6px 0",
            borderBottom: "1px solid var(--border)",
            whiteSpace: "nowrap",
            overflow: "visible",
            textAlign: "right",
          }}
        >
          <RowActions
            actions={[
              ...(isAdmin
                ? [
                    {
                      icon: <EditOutlined sx={{ fontSize: 14 }} />,
                      label: t("projects.action.edit"),
                      onClick: stopAndRun(() => onEdit(project)),
                      color: "accent" as const,
                    },
                  ]
                : []),
              {
                icon: (
                  <RefreshOutlined
                    sx={{
                      fontSize: 14,
                      animation: isScanning
                        ? `${spin} 1s linear infinite`
                        : "none",
                    }}
                  />
                ),
                label: t("projects.action.scan"),
                onClick: stopAndRun(() => onScan(project.id)),
                color: "yellow",
                disabled: isScanning,
              },
              ...(isAdmin
                ? [
                    {
                      icon: <DeleteOutlineOutlined sx={{ fontSize: 14 }} />,
                      label: t("projects.action.delete"),
                      onClick: stopAndRun(() => onDelete(project)),
                      color: "red" as const,
                    },
                  ]
                : []),
            ]}
          />
        </Box>
      </Box>
    );
  },
);
