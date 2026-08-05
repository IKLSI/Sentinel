import type React from "react";
import { Fragment, useRef } from "react";
import Box from "@mui/material/Box";
import {
  type CellAlign,
  TH,
} from "@/components/ui/common/VirtualTable/TableCells";
import { VirtualRowSpacer } from "@/components/ui/common/VirtualRowSpacer";
import { useVirtualRows } from "@/hooks/useVirtualRows";

export interface VirtualTableColumn {
  label: string;
  width: string;
  align?: CellAlign;
}

export interface VirtualTableProps<T> {
  rows: T[];
  getRowId: (row: T, index: number) => string | number;
  columns: VirtualTableColumn[];
  estimateRowHeight: number;
  renderRow: (
    row: T,
    index: number,
    measureRef?: (el: HTMLElement | null) => void,
  ) => React.ReactNode;
  measureRows?: boolean;
  overscan?: number;
  toolbar?: React.ReactNode;
  noResultsContent?: React.ReactNode;
}

export function VirtualTable<T>({
  rows,
  getRowId,
  columns,
  estimateRowHeight,
  renderRow,
  measureRows = false,
  overscan = 10,
  toolbar,
  noResultsContent,
}: VirtualTableProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const columnCount = columns.length;

  const { virtualizer, items, paddingTop, paddingBottom } = useVirtualRows({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: estimateRowHeight,
    overscan,
  });

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {toolbar && <Box sx={{ flexShrink: 0 }}>{toolbar}</Box>}

      <Box
        sx={{
          flexShrink: 0,
          overflow: "hidden",
          scrollbarGutter: "stable",
        }}
      >
        <Box
          component="table"
          sx={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <Box component="colgroup">
            {columns.map((c) => (
              <Box key={c.label} component="col" sx={{ width: c.width }} />
            ))}
          </Box>
          <Box component="thead">
            <Box component="tr">
              {columns.map((c) => (
                <TH key={c.label} align={c.align}>
                  {c.label}
                </TH>
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
          sx={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <Box component="colgroup">
            {columns.map((c) => (
              <Box key={c.label} component="col" sx={{ width: c.width }} />
            ))}
          </Box>
          <Box component="tbody">
            {rows.length === 0 && noResultsContent ? (
              noResultsContent
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
                      {renderRow(
                        row,
                        item.index,
                        measureRows ? virtualizer.measureElement : undefined,
                      )}
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
    </Box>
  );
}
