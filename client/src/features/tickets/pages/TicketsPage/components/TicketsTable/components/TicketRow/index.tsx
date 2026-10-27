import React from "react";
import Box from "@mui/material/Box";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { TruncatedText } from "@/components/ui/common/TruncatedText";
import { RowActions } from "@/components/ui/common/table/RowActions";
import { useT } from "@/contexts/I18nContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import type { Ticket } from "@/domains/tickets/types";
import { statusLabel } from "@/features/tickets/constants";
import { TEXT_ELLIPSIS_SX } from "@/constants/display";
import {
  priorityLabelKeyOf,
  typeBadgeStyleOf,
  typeIconOf,
  typeTooltipKeyOf,
} from "@/features/tickets/pages/TicketsPage/helpers";

const TICKET_CELL_SX = {
  padding: "9px 16px",
  borderBottom: "1px solid var(--border)",
  verticalAlign: "middle",
} as const;

const TICKET_CELL_TEXT_SX = {
  fontSize: "13px",
  lineHeight: 1.25,
  color: "var(--text)",
  ...TEXT_ELLIPSIS_SX,
} as const;

interface Props {
  ticket: Ticket;
  onEdit: (ticket: Ticket) => void;
  onDelete: (id: string, reference: string) => void;
}

const TicketRowComponent: React.FC<Props> = ({ ticket, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const router = useRouter();
  const t = useT();
  const isAdmin = useIsAdmin();

  const editAction = {
    icon: <EditOutlined sx={{ fontSize: 15 }} />,
    label: t("common.edit"),
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit(ticket);
    },
    color: "accent" as const,
  };
  const deleteAction = {
    icon: <DeleteOutlineOutlined sx={{ fontSize: 15 }} />,
    label: t("common.delete"),
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(ticket.id, ticket.reference);
    },
    color: "red" as const,
  };

  return (
    <Box
      component="tr"
      onClick={() =>
        navigate({ to: "/tickets/$id", params: { id: ticket.id } })
      }
      onMouseEnter={() =>
        void router.preloadRoute({
          to: "/tickets/$id",
          params: { id: ticket.id },
        })
      }
      sx={{
        cursor: "pointer",
        "&:hover td": { background: "var(--s2)" },
        "&:hover .row-actions": { opacity: "1 !important" },
      }}
    >
      <Box component="td" sx={TICKET_CELL_SX}>
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
            component={Link}
            to={`/tickets/${ticket.id}`}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            sx={{
              textDecoration: "none",
              minWidth: 0,
              color: "var(--text)",
              "&:hover": { textDecoration: "none" },
            }}
          >
            <TruncatedText text={ticket.title} fontSize="13px" strong />
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

      <Box component="td" sx={TICKET_CELL_SX}>
        <Box sx={TICKET_CELL_TEXT_SX}>
          {t(priorityLabelKeyOf(ticket.priority))}
        </Box>
      </Box>

      <Box component="td" sx={TICKET_CELL_SX}>
        <Box sx={TICKET_CELL_TEXT_SX}>{statusLabel(t, ticket.status)}</Box>
      </Box>

      <Box component="td" sx={TICKET_CELL_SX}>
        {ticket.assignedToName ? (
          <Box sx={{ lineHeight: 1.25, color: "var(--text)" }}>
            <TruncatedText text={ticket.assignedToName} fontSize="13px" />
          </Box>
        ) : (
          <Box
            sx={{ fontSize: "13px", lineHeight: 1.25, color: "var(--muted2)" }}
          >
            —
          </Box>
        )}
      </Box>

      <Box component="td" sx={{ ...TICKET_CELL_SX, textAlign: "center" }}>
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
          actions={isAdmin ? [editAction, deleteAction] : [editAction]}
        />
      </Box>
    </Box>
  );
};

export const TicketRow = React.memo(TicketRowComponent);
