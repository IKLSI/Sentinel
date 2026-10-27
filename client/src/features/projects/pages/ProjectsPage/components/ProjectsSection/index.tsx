import type React from "react";
import { useMemo } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import KeyboardArrowDownOutlined from "@mui/icons-material/KeyboardArrowDownOutlined";
import { GradeRing } from "@/components/ui/common/GradeRing";
import { SortableTh } from "@/components/ui/common/table/SortableTh";
import {
  OVERFLOWING_ATTRIBUTE,
  STICKY_ACTIONS_COLUMN_SX,
} from "@/components/ui/common/table/stickyActionsColumn";
import { useT } from "@/contexts/I18nContext";
import type {
  ProjectSearchMatch,
  ProjectSummary,
  ScanProgress,
} from "@/domains/projects/types";
import {
  GRADE_VISUAL,
  type SectionKey,
  UNTRACKED_SECTION,
  averageScore,
  sortProjects,
} from "@/features/projects/pages/ProjectsPage/helpers";
import { PROJECT_COLUMNS } from "@/features/projects/pages/ProjectsPage/constants";
import { ProjectRow } from "@/features/projects/pages/ProjectsPage/components/ProjectsSection/components/ProjectRow";
import { useSortState } from "@/hooks/useSortState";
import { useHorizontalScrollSync } from "@/hooks/useHorizontalScrollSync";
import { SortDirection } from "@/enums";
import { PANEL_SX } from "@/helpers/cardSx";

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
  onCancelScan: (id: string) => void;
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
  onCancelScan,
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

  return (
    <Box
      sx={{
        ...PANEL_SX,
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
          <GradeRing
            size={34}
            value={isUntrackedSection ? null : averageScore(items)}
            showTrack={!isUntrackedSection}
            color={cfg.iconColor}
            labelSx={{
              fontFamily: "var(--font-mono)",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            {isUntrackedSection ? <cfg.Icon sx={{ fontSize: 18 }} /> : grade}
          </GradeRing>
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
          <Table
            sx={{
              minWidth: "760px",
              tableLayout: "fixed",
              ...STICKY_ACTIONS_COLUMN_SX,
            }}
          >
            <Box component="colgroup">
              {PROJECT_COLUMNS.map(({ id, width }) => (
                <Box key={id} component="col" sx={{ width }} />
              ))}
            </Box>
            <TableHead>
              <TableRow>
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
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedItems.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onScan={onScan}
                  onCancelScan={onCancelScan}
                  isScanning={
                    scanningIds.has(project.id) || progressById.has(project.id)
                  }
                  dependencyMatch={matchesById?.get(project.id)}
                  scanProgress={progressById.get(project.id)}
                />
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
};
