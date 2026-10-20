import React from "react";
import Box from "@mui/material/Box";
import { useNavigate } from "@tanstack/react-router";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { RowActions } from "@/components/ui/common/RowActions";
import { useT } from "@/contexts/I18nContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import type { Ticket } from "@/domains/tickets/types";
import { statusLabel } from "@/features/tickets/constants";
import {
  priorityLabelKeyOf,
  typeBadgeStyleOf,
  typeIconOf,
  typeTooltipKeyOf,
} from "@/features/tickets/pages/TicketsPage/helpers";

interface Props {
  ticket: Ticket;
  onEdit: (ticket: Ticket) => void;
  onDelete: (id: string, reference: string) => void;
}

const TicketRowComponent: React.FC<Props> = ({ ticket, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const t = useT();
  const isAdmin = useIsAdmin();

  return (
    <Box
      component="tr"
      onClick={() =>
        navigate({ to: "/tickets/$id", params: { id: ticket.id } })
      }
      sx={{
        cursor: "pointer",
        "&:hover td": { background: "var(--s2)" },
        "&:hover .row-actions": { opacity: "1 !important" },
      }}
    >
      <Box
        component="td"
        sx={{
          padding: "11px 16px",
          borderBottom: "1px solid var(--border)",
          verticalAlign: "middle",
        }}
      >
        <Box
          sx={{ display: "flex", alignItems: "center", gap: "7px", mb: "4px" }}
        >
          <AppTooltip title={t(typeTooltipKeyOf(ticket.type))}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: typeBadgeStyleOf(ticket.type).color,
                flexShrink: 0,
              }}
            >
              {typeIconOf(ticket.type)}
            </Box>
          </AppTooltip>
          <Box
            sx={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {ticket.title}
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "11px",
            color: "var(--muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <Box>{ticket.reference}</Box>
          {ticket.projectName && (
            <>
              <Box sx={{ color: "var(--border2)" }}>·</Box>
              <Box>{ticket.projectName}</Box>
            </>
          )}
        </Box>
      </Box>

      <Box
        component="td"
        sx={{
          padding: "11px 16px",
          borderBottom: "1px solid var(--border)",
          verticalAlign: "middle",
        }}
      >
        <Box
          sx={{
            fontSize: "13px",
            lineHeight: 1.25,
            color: "var(--text)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {t(priorityLabelKeyOf(ticket.priority))}
        </Box>
      </Box>

      <Box
        component="td"
        sx={{
          padding: "11px 16px",
          borderBottom: "1px solid var(--border)",
          verticalAlign: "middle",
        }}
      >
        <Box
          sx={{
            fontSize: "13px",
            lineHeight: 1.25,
            color: "var(--text)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {statusLabel(t, ticket.status)}
        </Box>
      </Box>

      <Box
        component="td"
        sx={{
          padding: "11px 16px",
          borderBottom: "1px solid var(--border)",
          verticalAlign: "middle",
        }}
      >
        {ticket.assignedToName ? (
          <Box
            sx={{
              fontSize: "13px",
              lineHeight: 1.25,
              color: "var(--text)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {ticket.assignedToName}
          </Box>
        ) : (
          <Box
            sx={{ fontSize: "13px", lineHeight: 1.25, color: "var(--muted2)" }}
          >
            —
          </Box>
        )}
      </Box>

      <Box
        component="td"
        sx={{
          padding: "11px 16px",
          borderBottom: "1px solid var(--border)",
          verticalAlign: "middle",
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            fontSize: "13px",
            lineHeight: 1.25,
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
            color: ticket.commentCount > 0 ? "var(--text)" : "var(--muted2)",
          }}
        >
          {ticket.commentCount}
        </Box>
      </Box>

      <Box
        component="td"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        sx={{
          padding: "6px 20px 6px 0",
          borderBottom: "1px solid var(--border)",
          whiteSpace: "nowrap",
          overflow: "visible",
          textAlign: "right",
          verticalAlign: "middle",
        }}
      >
        <RowActions
          actions={[
            {
              icon: <EditOutlined sx={{ fontSize: 13 }} />,
              label: t("common.edit"),
              onClick: (e) => {
                e.stopPropagation();
                onEdit(ticket);
              },
              color: "accent",
            },
            ...(isAdmin
              ? [
                  {
                    icon: <DeleteOutlineOutlined sx={{ fontSize: 13 }} />,
                    label: t("common.delete"),
                    onClick: (e: React.MouseEvent) => {
                      e.stopPropagation();
                      onDelete(ticket.id, ticket.reference);
                    },
                    color: "red" as const,
                  },
                ]
              : []),
          ]}
        />
      </Box>
    </Box>
  );
};

export const TicketRow = React.memo(TicketRowComponent);
