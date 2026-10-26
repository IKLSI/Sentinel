import type React from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { LoadingRegion } from "@/components/ui/common/LoadingRegion";
import { SortableTh } from "@/components/ui/common/SortableTh";
import {
  type SkeletonCell,
  TableSkeletonRows,
} from "@/components/ui/common/TableSkeletonRows";
import { useT } from "@/contexts/I18nContext";
import { PROJECT_COLUMN_WIDTHS } from "@/features/projects/pages/ProjectsPage/constants";

const SKELETON_CELLS: readonly SkeletonCell[] = [
  "title",
  "count",
  "count",
  "count",
  "count",
  "empty",
];

const SECTIONS = [
  { id: "first", rows: 3 },
  { id: "second", rows: 2 },
];

export const ProjectsSkeleton: React.FC = () => {
  const t = useT();
  const headers = [
    t("projects.table.project"),
    t("projects.table.score"),
    t("projects.table.vulnerabilities"),
    t("projects.table.critical"),
    t("projects.table.tickets"),
  ];

  return (
    <LoadingRegion label={t("projects.loading")}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {SECTIONS.map(({ id, rows }) => (
          <Box
            key={id}
            sx={{
              background: "var(--s1)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r)",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                p: "11px 14px",
                background: "var(--s2)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <Skeleton variant="circular" width={34} height={34} />
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                <Skeleton variant="rounded" width={120} height={13} />
                <Skeleton variant="rounded" width={180} height={10} />
              </Box>
            </Box>
            <Box
              component="table"
              sx={{
                width: "100%",
                borderCollapse: "collapse",
                tableLayout: "fixed",
              }}
            >
              <Box component="colgroup">
                {PROJECT_COLUMN_WIDTHS.map(({ id: column, width }) => (
                  <Box key={column} component="col" sx={{ width }} />
                ))}
              </Box>
              <Box component="thead">
                <Box component="tr">
                  {headers.map((label, position) => (
                    <SortableTh
                      key={label}
                      align={position === 0 ? "left" : "center"}
                    >
                      {label}
                    </SortableTh>
                  ))}
                  <SortableTh />
                </Box>
              </Box>
              <Box component="tbody">
                <TableSkeletonRows
                  cells={SKELETON_CELLS}
                  rows={rows}
                  cellPadding="6px 12px"
                />
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </LoadingRegion>
  );
};
