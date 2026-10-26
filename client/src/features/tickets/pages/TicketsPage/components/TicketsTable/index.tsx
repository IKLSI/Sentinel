import React from "react";
import Box from "@mui/material/Box";
import ConfirmationNumberOutlined from "@mui/icons-material/ConfirmationNumberOutlined";
import { EmptyState } from "@/components/ui/common/EmptyState";
import { useT } from "@/contexts/I18nContext";
import type { Ticket } from "@/domains/tickets/types";
import { TicketRow } from "@/features/tickets/pages/TicketsPage/components/TicketRow";
import { SortDirection, TicketSortField } from "@/enums";
import { SortableTh } from "@/components/ui/common/SortableTh";
import { LoadingStatus } from "@/components/ui/common/LoadingStatus";
import {
  type SkeletonCell,
  TableSkeletonRows,
} from "@/components/ui/common/TableSkeletonRows";
import { DELAYED_REVEAL_SX } from "@/styles/keyframes";
import { useHorizontalScrollSync } from "@/hooks/useHorizontalScrollSync";
import {
  OVERFLOWING_ATTRIBUTE,
  STICKY_ACTIONS_COLUMN_SX,
} from "@/components/ui/common/stickyActionsColumn";

export interface SortState {
  col: TicketSortField;
  dir: SortDirection;
}

interface TicketColumn {
  col: TicketSortField | typeof ACTIONS_COLUMN_KEY;
  label: string;
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

const COLS = ["auto", "110px", "130px", "170px", "100px", "120px"] as const;
const COLGROUP = (
  <Box component="colgroup">
    {COLS.map((w) => (
      <Box key={w} component="col" sx={{ width: w }} />
    ))}
  </Box>
);
const ACTIONS_COLUMN_KEY = "actions";
const SKELETON_CELLS: readonly SkeletonCell[] = [
  "title",
  "chip",
  "chip",
  "avatar",
  "count",
  "empty",
];

const TABLE_SX = {
  width: "100%",
  minWidth: "820px",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  ...STICKY_ACTIONS_COLUMN_SX,
} as const;

const isSortableColumn = (col: TicketColumn["col"]): col is TicketSortField =>
  col !== ACTIONS_COLUMN_KEY;

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
        <Box component="table" sx={TABLE_SX}>
          {COLGROUP}
          <Box component="thead">
            <Box component="tr">
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
            </Box>
          </Box>
        </Box>
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
        <Box component="table" sx={TABLE_SX}>
          {COLGROUP}
          <Box component="tbody" sx={loading ? DELAYED_REVEAL_SX : undefined}>
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
          </Box>
        </Box>
        {loading && <LoadingStatus label={t("tickets.list.loading")} />}
      </Box>
    </Box>
  );
};

export const TicketsTable = React.memo(TicketsTableComponent);
