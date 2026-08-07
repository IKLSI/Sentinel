import type React from "react";
import { Fragment, useRef } from "react";
import Box from "@mui/material/Box";
import type {
  CellAlign,
  SortDirection,
} from "@/components/ui/common/VirtualTable/TableCells";
import { SortableTh } from "@/components/ui/common/SortableTh";
import { VirtualRowSpacer } from "@/components/ui/common/VirtualRowSpacer";
import { useVirtualRows } from "@/hooks/useVirtualRows";

export interface VirtualTableColumn {
  key: string;
  label: string;
  width: string;
  align?: CellAlign;
  sortable?: boolean;
}

export interface VirtualTableSort {
  key: string;
  direction: SortDirection;
}

interface VirtualTableProps<T> {
  rows: T[];
  getRowId: (row: T, index: number) => string | number;
  columns: VirtualTableColumn[];
  estimateRowHeight: number;
  renderRow: (row: T, index: number) => React.ReactNode;
  overscan?: number;
  sort?: VirtualTableSort;
  onSortChange?: (key: string) => void;
  noResultsLabel?: string;
  footer?: React.ReactNode;
}

const tableSx = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
} as const;

const noResultsSx = {
  padding: "48px 16px",
  textAlign: "center",
  verticalAlign: "middle",
  color: "var(--muted)",
  fontSize: "13px",
  borderBottom: "none",
} as const;

export function VirtualTable<T>({
  rows,
  getRowId,
  columns,
  estimateRowHeight,
  renderRow,
  overscan = 10,
  sort,
  onSortChange,
  noResultsLabel,
  footer,
}: VirtualTableProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const columnCount = columns.length;
  const showNoResults = rows.length === 0 && Boolean(noResultsLabel);

  const { items, paddingTop, paddingBottom } = useVirtualRows({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: estimateRowHeight,
    overscan,
  });

  const columnGroup = (
    <Box component="colgroup">
      {columns.map((column) => (
        <Box key={column.key} component="col" sx={{ width: column.width }} />
      ))}
    </Box>
  );

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        background: "var(--s1)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          overflow: "hidden",
          scrollbarGutter: "stable",
          background: "var(--s2)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Box component="table" sx={tableSx}>
          {columnGroup}
          <Box component="thead">
            <Box component="tr">
              {columns.map((column) => (
                <SortableTh
                  key={column.key}
                  align={column.align}
                  sortable={column.sortable}
                  active={sort?.key === column.key}
                  ascending={sort?.direction === "asc"}
                  onSort={() => onSortChange?.(column.key)}
                >
                  {column.label}
                </SortableTh>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        ref={scrollRef}
        sx={{ overflowY: "auto", flex: 1, scrollbarGutter: "stable" }}
      >
        <Box
          component="table"
          sx={{ ...tableSx, height: showNoResults ? "100%" : undefined }}
        >
          {columnGroup}
          <Box component="tbody">
            {showNoResults ? (
              <Box component="tr">
                <Box component="td" colSpan={columnCount} sx={noResultsSx}>
                  {noResultsLabel}
                </Box>
              </Box>
            ) : (
              <>
                <VirtualRowSpacer
                  height={paddingTop}
                  columnCount={columnCount}
                />
                {items.map((item) => {
                  const row = rows[item.index];
                  return (
                    <Fragment key={getRowId(row, item.index)}>
                      {renderRow(row, item.index)}
                    </Fragment>
                  );
                })}
                <VirtualRowSpacer
                  height={paddingBottom}
                  columnCount={columnCount}
                />
              </>
            )}
          </Box>
        </Box>
      </Box>

      {footer}
    </Box>
  );
}
