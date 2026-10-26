import type React from "react";
import { useMemo } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import KeyboardArrowDownOutlined from "@mui/icons-material/KeyboardArrowDownOutlined";
import { useT } from "@/contexts/I18nContext";
import type {
  ProjectSearchMatch,
  ProjectSummary,
  ScanProgress,
} from "@/domains/projects/types";
import { SortableTh } from "@/components/ui/common/SortableTh";
import {
  GRADE_VISUAL,
  type SectionKey,
  UNTRACKED_SECTION,
  sortProjects,
} from "@/features/projects/pages/ProjectsPage/helpers";
import { ProjectRow } from "@/features/projects/pages/ProjectsPage/components/ProjectRow";
import { PROJECT_COLUMNS } from "@/features/projects/pages/ProjectsPage/constants";
import { useSortState } from "@/hooks/useSortState";
import { SortDirection } from "@/enums";
import { useHorizontalScrollSync } from "@/hooks/useHorizontalScrollSync";
import {
  OVERFLOWING_ATTRIBUTE,
  STICKY_ACTIONS_COLUMN_SX,
} from "@/components/ui/common/stickyActionsColumn";

interface Props {
  grade: SectionKey;
  items: ProjectSummary[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  scanningIds: ReadonlySet<string>;
  matchesById?: Map<string, ProjectSearchMatch>;
  progressById: Map<string, ScanProgress>;
  onEdit: (project: ProjectSummary) => void;
  onDelete: (project: ProjectSummary) => void;
  onScan: (id: string) => void;
}

export const ProjectsSection: React.FC<Props> = ({
  grade,
  items,
  collapsed,
  onToggleCollapsed,
  scanningIds,
  matchesById,
  progressById,
  onEdit,
  onDelete,
  onScan,
}) => {
  const t = useT();
  const { bodyRef, overflowing } = useHorizontalScrollSync();
  const [sort, toggleSort] = useSortState<string>({
    col: "critical",
    dir: SortDirection.Desc,
  });
  const sortedItems = useMemo(() => sortProjects(items, sort), [items, sort]);
  const cfg = GRADE_VISUAL[grade];
  const isUntrackedSection = grade === UNTRACKED_SECTION;
  const scoredItems = items.filter((p) => p.healthScore !== null);
  const avgScore =
    !isUntrackedSection && scoredItems.length
      ? scoredItems.reduce((sum, p) => sum + (p.healthScore ?? 0), 0) /
        scoredItems.length
      : 0;

  return (
    <Box
      sx={{
        background: "var(--s1)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
        overflow: "hidden",
      }}
    >
      <ButtonBase
        type="button"
        aria-expanded={!collapsed}
        aria-label={
          collapsed
            ? t("projects.section.expand")
            : t("projects.section.collapse")
        }
        onClick={onToggleCollapsed}
        sx={{
          font: "inherit",
          textAlign: "inherit",
          width: "100%",
          boxSizing: "border-box",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          p: "11px 14px",
          background: "var(--s2)",
          borderBottom: "1px solid var(--border)",
          transition: "background 0.12s",
          "&:hover": { background: "var(--s3)" },
          "&:focus-visible": {
            outline: "2px solid var(--accent)",
            outlineOffset: "-2px",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: "34px",
              height: "34px",
              flexShrink: 0,
            }}
          >
            {!isUntrackedSection && (
              <>
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={34}
                  thickness={2.5}
                  sx={{
                    position: "absolute",
                    inset: 0,
                    color: "var(--border)",
                  }}
                />
                <CircularProgress
                  variant="determinate"
                  value={avgScore}
                  size={34}
                  thickness={2.5}
                  sx={{ position: "absolute", inset: 0, color: cfg.iconColor }}
                />
              </>
            )}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: cfg.iconColor,
                fontFamily: "var(--font-mono)",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              {isUntrackedSection ? <cfg.Icon sx={{ fontSize: 18 }} /> : grade}
            </Box>
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Box
              sx={{
                fontSize: "13px",
                fontWeight: 700,
                color: cfg.iconColor,
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
                fontFamily: "var(--font-ui)",
              }}
            >
              {t(`projects.grade.${grade}.label`)}
            </Box>
            <Box
              sx={{
                fontSize: "11px",
                color: "var(--muted2)",
                mt: "2px",
                lineHeight: 1.2,
              }}
            >
              {t(`projects.grade.${grade}.subtitle`)}
            </Box>
          </Box>
        </Box>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--muted2)",
          }}
        >
          <KeyboardArrowDownOutlined
            sx={{
              fontSize: 20,
              transform: collapsed ? "rotate(0deg)" : "rotate(180deg)",
              transition: "transform 360ms cubic-bezier(0.22, 1, 0.36, 1)",
              transformOrigin: "center",
              willChange: "transform",
            }}
          />
        </Box>
      </ButtonBase>

      {!collapsed && (
        <Box
          ref={bodyRef}
          {...{ [OVERFLOWING_ATTRIBUTE]: overflowing }}
          sx={{ overflowX: "auto", overflowY: "hidden" }}
        >
          <Box
            component="table"
            sx={{
              width: "100%",
              minWidth: "760px",
              borderCollapse: "collapse",
              tableLayout: "fixed",
              ...STICKY_ACTIONS_COLUMN_SX,
            }}
          >
            <Box component="colgroup">
              {PROJECT_COLUMNS.map(({ id, width }) => (
                <Box key={id} component="col" sx={{ width }} />
              ))}
            </Box>
            <Box component="thead">
              <Box component="tr">
                {PROJECT_COLUMNS.map(({ id, labelKey, align }) => (
                  <SortableTh
                    key={id}
                    align={align}
                    sortable={labelKey !== null}
                    active={labelKey !== null && sort.col === id}
                    ascending={sort.dir === SortDirection.Asc}
                    onSort={() => toggleSort(id)}
                  >
                    {labelKey && t(labelKey)}
                  </SortableTh>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {sortedItems.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onScan={onScan}
                  isScanning={
                    scanningIds.has(project.id) || progressById.has(project.id)
                  }
                  dependencyMatch={matchesById?.get(project.id)}
                  scanProgress={progressById.get(project.id)}
                />
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};
