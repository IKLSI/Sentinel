import React from "react";
import Box from "@mui/material/Box";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { RowActions } from "@/components/ui/common/table/RowActions";
import { ROW_ACTIONS_CELL_SX } from "@/components/ui/common/table/stickyActionsColumn";
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

const renderMetricCell = (
  value: React.ReactNode,
  emphasized: boolean,
  accent: string | undefined,
) => (
  <TableCell size="small" align="center">
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
  </TableCell>
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
      <TableRow
        hover
        onClick={() =>
          navigate({ to: "/projects/$id", params: { id: project.id } })
        }
        onMouseEnter={() =>
          void router.preloadRoute({
            to: "/projects/$id",
            params: { id: project.id },
          })
        }
        sx={{ cursor: "pointer", position: "relative" }}
      >
        <TableCell size="small" sx={{ fontSize: "12px" }}>
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
        </TableCell>

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

        <TableCell
          align="right"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          sx={ROW_ACTIONS_CELL_SX}
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
        </TableCell>
      </TableRow>
    );
  },
);
