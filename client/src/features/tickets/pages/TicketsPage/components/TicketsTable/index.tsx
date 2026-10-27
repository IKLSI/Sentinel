import React from "react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ConfirmationNumberOutlined from "@mui/icons-material/ConfirmationNumberOutlined";
import { EmptyState } from "@/components/ui/common/feedback/EmptyState";
import { useT } from "@/contexts/I18nContext";
import type { Ticket } from "@/domains/tickets/types";
import { SortDirection, TicketSortField } from "@/enums";
import { SortableTh } from "@/components/ui/common/table/SortableTh";
import { LoadingStatus } from "@/components/ui/common/feedback/LoadingStatus";
import {
  type SkeletonCell,
  TableSkeletonRows,
} from "@/components/ui/common/table/TableSkeletonRows";
import { DELAYED_REVEAL_SX } from "@/styles/keyframes";
import { useHorizontalScrollSync } from "@/hooks/useHorizontalScrollSync";
import {
  OVERFLOWING_ATTRIBUTE,
  STICKY_ACTIONS_COLUMN_SX,
} from "@/components/ui/common/table/stickyActionsColumn";
import { TicketRow } from "@/features/tickets/pages/TicketsPage/components/TicketsTable/components/TicketRow";

export interface SortState {
  col: TicketSortField;
  dir: SortDirection;
}

interface Props {
  tickets: Ticket[];
  sort: SortState;
  onToggleSort: (col: TicketSortField) => void;
  onEdit: (ticket: Ticket) => void;
  onDelete: (id: string, reference: string) => void;
  hasFiltersApplied: boolean;
  loading?: boolean;
}

const ACTIONS_COLUMN_KEY = "actions";

interface TicketColumn {
  col: TicketSortField | typeof ACTIONS_COLUMN_KEY;
  label: string;
}

const isSortableColumn = (col: TicketColumn["col"]): col is TicketSortField =>
  col !== ACTIONS_COLUMN_KEY;

const TICKETS_COLUMN_WIDTHS = [
  "auto",
  "110px",
  "130px",
  "170px",
  "100px",
  "120px",
] as const;

const TICKETS_TABLE_SX = {
  minWidth: "820px",
  tableLayout: "fixed",
  ...STICKY_ACTIONS_COLUMN_SX,
} as const;

const COL_GROUP = (
  <Box component="colgroup">
    {TICKETS_COLUMN_WIDTHS.map((w) => (
      <Box key={w} component="col" sx={{ width: w }} />
    ))}
  </Box>
);

const SKELETON_CELLS: readonly SkeletonCell[] = [
  "title",
  "chip",
  "chip",
  "avatar",
  "count",
  "empty",
];

const TicketsTableComponent: React.FC<Props> = ({
  tickets,
  sort,
  onToggleSort,
  onEdit,
  onDelete,
  hasFiltersApplied,
  loading = false,
}) => {
  const t = useT();
  const { headerRef, bodyRef, overflowing, syncHeader } =
    useHorizontalScrollSync();

  const columns: TicketColumn[] = [
    { col: TicketSortField.Title, label: t("tickets.list.col_ticket") },
    { col: TicketSortField.Priority, label: t("tickets.list.col_priority") },
    { col: TicketSortField.Status, label: t("tickets.list.col_status") },
    { col: TicketSortField.Assignee, label: t("tickets.list.col_assignee") },
    { col: TicketSortField.Comments, label: t("tickets.list.col_comments") },
    { col: ACTIONS_COLUMN_KEY, label: "" },
  ];

  if (!loading && tickets.length === 0) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <EmptyState
          icon={ConfirmationNumberOutlined}
          title={t("tickets.list.empty_title")}
          subtitle={
            !hasFiltersApplied
              ? t("tickets.list.empty_subtitle_create")
              : t("tickets.list.empty_subtitle_search")
          }
          iconSize={40}
        />
      </Box>
    );
  }

  return (
    <Box
      {...{ [OVERFLOWING_ATTRIBUTE]: overflowing }}
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box
        ref={headerRef}
        sx={{
          flexShrink: 0,
          overflow: "hidden",
          scrollbarGutter: "stable",
          background: "var(--s2)",
          boxShadow: "inset 0 -1px 0 var(--border)",
        }}
      >
        <Table sx={TICKETS_TABLE_SX}>
          {COL_GROUP}
          <TableHead>
            <TableRow>
              {columns.map(({ col, label }) => {
                const sortable = isSortableColumn(col);
                return (
                  <SortableTh
                    key={col}
                    align={col === TicketSortField.Comments ? "center" : "left"}
                    sortable={sortable}
                    active={sortable && sort.col === col}
                    ascending={sort.dir === SortDirection.Asc}
                    onSort={() => isSortableColumn(col) && onToggleSort(col)}
                  >
                    {label}
                  </SortableTh>
                );
              })}
            </TableRow>
          </TableHead>
        </Table>
      </Box>

      <Box
        ref={bodyRef}
        onScroll={syncHeader}
        aria-busy={loading || undefined}
        sx={{
          position: "relative",
          flex: 1,
          overflowX: loading ? "hidden" : "auto",
          overflowY: loading ? "hidden" : "auto",
          scrollbarGutter: "stable",
        }}
      >
        <Table sx={TICKETS_TABLE_SX}>
          {COL_GROUP}
          <TableBody sx={loading ? DELAYED_REVEAL_SX : undefined}>
            {loading ? (
              <TableSkeletonRows cells={SKELETON_CELLS} />
            ) : (
              tickets.map((ticket) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </TableBody>
        </Table>
        {loading && <LoadingStatus label={t("tickets.list.loading")} />}
      </Box>
    </Box>
  );
};

export const TicketsTable = React.memo(TicketsTableComponent);
