import type React from "react";
import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import { TruncatedText } from "@/components/ui/common/TruncatedText";
import { RowActions } from "@/components/ui/common/table/RowActions";
import { SortableTh } from "@/components/ui/common/table/SortableTh";
import { ROW_ACTIONS_CELL_SX } from "@/components/ui/common/table/stickyActionsColumn";
import { gradeToneOf } from "@/constants/grades";
import { useT } from "@/contexts/I18nContext";
import {
  ACTIONS_COLUMN_WIDTH,
  PROJECT_COLUMNS,
  SAMPLE_PROJECTS,
  TABLE_MIN_WIDTH,
} from "@/features/styleGuide/pages/StyleGuidePage/components/TablesSection/constants";
import {
  compareBy,
  nextSort,
} from "@/features/styleGuide/pages/StyleGuidePage/components/TablesSection/helpers";
import type {
  ProjectSort,
  SampleProject,
} from "@/features/styleGuide/pages/StyleGuidePage/components/TablesSection/types";
import { PANEL_SX } from "@/helpers/cardSx";

const ignore = () => undefined;

const metricSx = (emphasized: boolean, color: string | undefined) => ({
  color: emphasized ? color : "var(--muted2)",
  fontWeight: emphasized ? 700 : 500,
  fontSize: "13px",
  lineHeight: 1.25,
  fontFamily: "var(--font-mono)",
});

export const ProjectsTable: React.FC = () => {
  const t = useT();
  const [sort, setSort] = useState<ProjectSort>({
    key: "score",
    direction: "desc",
  });

  const rows = useMemo(
    () =>
      [...SAMPLE_PROJECTS].sort(
        compareBy<SampleProject, ProjectSort["key"]>(sort.key, sort.direction),
      ),
    [sort],
  );

  const metricCells = (project: SampleProject) => [
    {
      key: "score",
      value: project.score,
      color: gradeToneOf(project.grade)?.color,
    },
    { key: "critical", value: project.critical, color: "var(--red)" },
    { key: "total", value: project.total, color: "var(--orange)" },
    { key: "tickets", value: project.tickets, color: "var(--text)" },
  ];

  return (
    <Box sx={{ ...PANEL_SX, overflowX: "auto" }}>
      <Table sx={{ minWidth: TABLE_MIN_WIDTH, tableLayout: "fixed" }}>
        <Box component="colgroup">
          {PROJECT_COLUMNS.map((column) => (
            <Box
              key={column.key}
              component="col"
              sx={{ width: column.width }}
            />
          ))}
          <Box component="col" sx={{ width: ACTIONS_COLUMN_WIDTH }} />
        </Box>
        <TableHead>
          <TableRow>
            {PROJECT_COLUMNS.map((column) => (
              <SortableTh
                key={column.key}
                align={column.align}
                sortable
                active={sort.key === column.key}
                ascending={sort.direction === "asc"}
                onSort={() =>
                  setSort((current) => nextSort(current, column.key))
                }
              >
                {t(column.labelKey)}
              </SortableTh>
            ))}
            <SortableTh />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((project) => (
            <TableRow key={project.id} hover>
              <TableCell size="small">
                <TruncatedText text={project.name} fontSize="13px" strong />
                <Box sx={{ mt: "3px", color: "var(--muted2)" }}>
                  <TruncatedText text={project.repository} mono />
                </Box>
              </TableCell>
              {metricCells(project).map(({ key, value, color }) => (
                <TableCell key={key} size="small" align="center">
                  <Box sx={metricSx(value > 0, color)}>{value}</Box>
                </TableCell>
              ))}
              <TableCell size="small" align="right" sx={ROW_ACTIONS_CELL_SX}>
                <RowActions
                  actions={[
                    {
                      icon: <EditOutlined sx={{ fontSize: 14 }} />,
                      label: t("projects.action.edit"),
                      onClick: ignore,
                      color: "accent",
                    },
                    {
                      icon: <RefreshOutlined sx={{ fontSize: 14 }} />,
                      label: t("projects.action.scan"),
                      onClick: ignore,
                      color: "accent",
                      disabled: project.id === "docs-site",
                    },
                    {
                      icon: <DeleteOutlineOutlined sx={{ fontSize: 14 }} />,
                      label: t("projects.action.delete"),
                      onClick: ignore,
                      color: "red",
                    },
                  ]}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};
