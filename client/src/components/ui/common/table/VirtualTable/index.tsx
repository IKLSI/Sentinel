import type React from "react";
import { Fragment } from "react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import {
  type CellAlign,
  type SortDirection,
  VirtualRowMeasureContext,
} from "@/components/ui/common/table/VirtualTable/TableCells";
import { SortableTh } from "@/components/ui/common/table/SortableTh";
import { VirtualRowSpacer } from "@/components/ui/common/table/VirtualTable/VirtualRowSpacer";
import { useVirtualRows } from "@/hooks/useVirtualRows";
import { useHorizontalScrollSync } from "@/hooks/useHorizontalScrollSync";
import {
  OVERFLOWING_ATTRIBUTE,
  STICKY_ACTIONS_COLUMN_SX,
} from "@/components/ui/common/table/stickyActionsColumn";
import { PANEL_SX } from "@/helpers/cardSx";

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
  minWidth?: string;
}

const DEFAULT_MIN_WIDTH = "960px";

const tableSx = {
  tableLayout: "fixed",
  ...STICKY_ACTIONS_COLUMN_SX,
} as const;

const noResultsSx = {
  padding: "48px 16px",
  textAlign: "center",
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
  minWidth = DEFAULT_MIN_WIDTH,
}: VirtualTableProps<T>) {
  const { headerRef, bodyRef, body, overflowing, syncHeader } =
    useHorizontalScrollSync();
  const columnCount = columns.length;
  const showNoResults = rows.length === 0 && Boolean(noResultsLabel);

  const { virtualizer, items, paddingTop, paddingBottom } = useVirtualRows({
    count: rows.length,
    getScrollElement: () => body,
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
      {...{ [OVERFLOWING_ATTRIBUTE]: overflowing }}
      sx={{
        flex: 1,
        minHeight: 0,
        ...PANEL_SX,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        ref={headerRef}
        sx={{
          flexShrink: 0,
          overflow: "hidden",
          scrollbarGutter: "stable",
          background: "var(--s2)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Table sx={{ ...tableSx, minWidth }}>
          {columnGroup}
          <TableHead>
            <TableRow>
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
            </TableRow>
          </TableHead>
        </Table>
      </Box>

      <Box
        ref={bodyRef}
        onScroll={syncHeader}
        sx={{
          overflowY: "auto",
          overflowX: "auto",
          flex: 1,
          scrollbarGutter: "stable",
        }}
      >
        <Table
          sx={{
            ...tableSx,
            minWidth,
            height: showNoResults ? "100%" : undefined,
          }}
        >
          {columnGroup}
          <TableBody>
            {showNoResults ? (
              <TableRow>
                <TableCell colSpan={columnCount} sx={noResultsSx}>
                  {noResultsLabel}
                </TableCell>
              </TableRow>
            ) : (
              <VirtualRowMeasureContext.Provider
                value={virtualizer.measureElement}
              >
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
              </VirtualRowMeasureContext.Provider>
            )}
          </TableBody>
        </Table>
      </Box>

      {footer}
    </Box>
  );
}
