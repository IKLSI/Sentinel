import React from "react";
import Box from "@mui/material/Box";
import ConfirmationNumberOutlined from "@mui/icons-material/ConfirmationNumberOutlined";
import { useT } from "@/i18n/I18nContext";
import { Ticket } from "@/types";
import { TicketRow } from "../TicketRow";

export interface SortState {
  col: string;
  dir: "asc" | "desc";
}

interface Props {
  tickets: Ticket[];
  sort: SortState | null;
  onToggleSort: (col: string) => void;
  onEdit: (ticket: Ticket) => void;
  onDelete: (id: string, reference: string) => void;
  hasFiltersApplied: boolean;
  notifTicketIds?: Set<string>;
}

const COLS = ["52%", "10%", "11%", "15%", "12%"] as const;

const TicketsTableComponent: React.FC<Props> = ({
  tickets,
  sort,
  onToggleSort,
  onEdit,
  onDelete,
  hasFiltersApplied,
  notifTicketIds,
}) => {
  const t = useT();

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
          {COLS.map((w, i) => (
            <Box key={i} component="col" sx={{ width: w }} />
          ))}
        </Box>
        <Box component="thead">
          <Box component="tr">
            {[
              { col: "title", label: t("tickets.list.col_ticket") },
              { col: "priority", label: t("tickets.list.col_priority") },
              { col: "status", label: t("tickets.list.col_status") },
              { col: "assignee", label: t("tickets.list.col_assignee") },
              { col: "", label: "" },
            ].map(({ col, label }) => {
              const sortable = col !== "";
              const isActive = sort?.col === col;
              return (
                <Box
                  component="th"
                  key={col || "actions"}
                  onClick={() => sortable && onToggleSort(col)}
                  sx={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: isActive ? "var(--accent)" : "var(--muted)",
                    textAlign: "left",
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--border)",
                    background: "var(--s2)",
                    whiteSpace: "nowrap",
                    cursor: sortable ? "pointer" : "default",
                    userSelect: "none",
                    transition: "color 0.12s",
                    "&:hover": sortable
                      ? { color: "var(--text-secondary)" }
                      : {},
                  }}
                >
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: "5px" }}
                  >
                    {label}
                    {sortable && isActive && (
                      <Box
                        sx={{
                          fontSize: "12px",
                          color: "var(--accent)",
                          lineHeight: 1,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {sort?.dir === "asc" ? "↑" : "↓"}
                      </Box>
                    )}
                  </Box>
                </Box>
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
            {COLS.map((w, i) => (
              <Box key={i} component="col" sx={{ width: w }} />
            ))}
          </Box>
          <Box component="tbody">
            {tickets.map((ticket) => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                onEdit={onEdit}
                onDelete={onDelete}
                hasNotif={notifTicketIds?.has(ticket.id) ?? false}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </>
  );
};

export const TicketsTable = React.memo(TicketsTableComponent);
