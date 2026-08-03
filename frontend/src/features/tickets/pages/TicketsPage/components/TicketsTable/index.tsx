import React from "react";
import Box from "@mui/material/Box";
import ConfirmationNumberOutlined from "@mui/icons-material/ConfirmationNumberOutlined";
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
}

const COLS = ["52%", "10%", "11%", "15%", "12%"] as const;
const ACTIONS_COLUMN_KEY = "actions";

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
        <Box className="empty-state">
          <Box className="empty-state-icon">
            <ConfirmationNumberOutlined sx={{ fontSize: 40 }} />
          </Box>
          <Box className="empty-state-title">
            {t("tickets.list.empty_title")}
          </Box>
          <Box className="empty-state-subtitle">
            {!hasFiltersApplied
              ? t("tickets.list.empty_subtitle_create")
              : t("tickets.list.empty_subtitle_search")}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Box
        component="table"
        sx={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
          flexShrink: 0,
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
              const sortable = col !== ACTIONS_COLUMN_KEY;
              return (
                <SortableTh
                  key={col}
                  mono
                  sortable={sortable}
                  active={sort.col === col}
                  ascending={sort.dir === SortDirection.Asc}
                  onSort={() => col !== ACTIONS_COLUMN_KEY && onToggleSort(col)}
                >
                  {label}
                </SortableTh>
              );
            })}
          </Box>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto" }}>
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
    </>
  );
};

export const TicketsTable = React.memo(TicketsTableComponent);
