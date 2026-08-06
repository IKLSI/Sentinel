import React from "react";
import Box from "@mui/material/Box";
import ConfirmationNumberOutlined from "@mui/icons-material/ConfirmationNumberOutlined";
import { EmptyState } from "@/components/ui/common/EmptyState";
import { useT } from "@/contexts/I18nContext";
import type { Ticket } from "@/domains/tickets/types";
import { TicketRow } from "@/features/tickets/pages/TicketsPage/components/TicketRow";
import { SortDirection, TicketSortField } from "@/enums";
import { SortableTh } from "@/components/ui/common/SortableTh";

export interface SortState {
  col: TicketSortField;
  dir: SortDirection;
}

interface TicketColumn {
  col: TicketSortField | typeof COMMENTS_COLUMN_KEY | typeof ACTIONS_COLUMN_KEY;
  label: string;
}

interface Props {
  tickets: Ticket[];
  sort: SortState;
  onToggleSort: (col: TicketSortField) => void;
  onEdit: (ticket: Ticket) => void;
  onDelete: (id: string, reference: string) => void;
  hasFiltersApplied: boolean;
}

const COLS = ["auto", "110px", "130px", "170px", "100px", "120px"] as const;
const COMMENTS_COLUMN_KEY = "comments";
const ACTIONS_COLUMN_KEY = "actions";

const isSortableColumn = (col: TicketColumn["col"]): col is TicketSortField =>
  col !== COMMENTS_COLUMN_KEY && col !== ACTIONS_COLUMN_KEY;

const TicketsTableComponent: React.FC<Props> = ({
  tickets,
  sort,
  onToggleSort,
  onEdit,
  onDelete,
  hasFiltersApplied,
}) => {
  const t = useT();

  const columns: TicketColumn[] = [
    { col: TicketSortField.Title, label: t("tickets.list.col_ticket") },
    { col: TicketSortField.Priority, label: t("tickets.list.col_priority") },
    { col: TicketSortField.Status, label: t("tickets.list.col_status") },
    { col: TicketSortField.Assignee, label: t("tickets.list.col_assignee") },
    { col: COMMENTS_COLUMN_KEY, label: t("tickets.list.col_comments") },
    { col: ACTIONS_COLUMN_KEY, label: "" },
  ];

  if (tickets.length === 0) {
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
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          overflow: "hidden",
          scrollbarGutter: "stable",
          background: "var(--s2)",
          boxShadow: "inset 0 -1px 0 var(--border)",
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
            {COLS.map((w) => (
              <Box key={w} component="col" sx={{ width: w }} />
            ))}
          </Box>
          <Box component="thead">
            <Box component="tr">
              {columns.map(({ col, label }) => {
                const sortable = isSortableColumn(col);
                return (
                  <SortableTh
                    key={col}
                    mono
                    align={col === COMMENTS_COLUMN_KEY ? "center" : "left"}
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

      <Box sx={{ flex: 1, overflowY: "auto", scrollbarGutter: "stable" }}>
        <Box
          component="table"
          sx={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <Box component="colgroup">
            {COLS.map((w) => (
              <Box key={w} component="col" sx={{ width: w }} />
            ))}
          </Box>
          <Box component="tbody">
            {tickets.map((ticket) => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export const TicketsTable = React.memo(TicketsTableComponent);
