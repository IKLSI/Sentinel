import React from "react";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import { useNavigate } from "react-router-dom";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import { RowActions } from "@/components/RowActions";
import { useT } from "@/i18n/I18nContext";
import { Ticket } from "@/types";
import {
  getAvatarStyle,
  priorityColor,
  priorityLabelKeys,
  typeBadgeStyle,
  typeIcons,
  typeTooltipKeys,
} from "../../helpers";

interface Props {
  ticket: Ticket;
  onEdit: (ticket: Ticket) => void;
  onDelete: (id: string, reference: string) => void;
}

const TicketRowComponent: React.FC<Props> = ({ ticket, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const t = useT();

  return (
    <Box
      component="tr"
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      sx={{
        cursor: "pointer",
        "&:hover td": { background: "var(--s2)" },
        "&:hover .row-actions": { opacity: "1 !important" },
      }}
    >
      <Box
        component="td"
        sx={{
          padding: "11px 14px",
          borderBottom: "1px solid var(--border)",
          verticalAlign: "middle",
        }}
      >
        <Box
          sx={{ display: "flex", alignItems: "center", gap: "7px", mb: "4px" }}
        >
          <Tooltip
            title={t(typeTooltipKeys[ticket.type])}
            arrow
            placement="top"
          >
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: typeBadgeStyle[ticket.type].color,
                flexShrink: 0,
              }}
            >
              {typeIcons[ticket.type]}
            </Box>
          </Tooltip>
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
          padding: "11px 14px",
          borderBottom: "1px solid var(--border)",
          verticalAlign: "middle",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            fontSize: "12px",
            color: "var(--text-secondary)",
          }}
        >
          <Box
            sx={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: priorityColor[ticket.priority],
              flexShrink: 0,
              boxShadow: `0 0 5px ${priorityColor[ticket.priority]}`,
            }}
          />
          {t(priorityLabelKeys[ticket.priority])}
        </Box>
      </Box>

      <Box
        component="td"
        sx={{
          padding: "11px 14px",
          borderBottom: "1px solid var(--border)",
          verticalAlign: "middle",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            fontSize: "12px",
            color: "var(--text-secondary)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Box
              sx={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: ticket.statusColor,
                flexShrink: 0,
                boxShadow: `0 0 5px ${ticket.statusColor}`,
              }}
            />
            {ticket.statusName}
          </Box>
        </Box>
      </Box>

      <Box
        component="td"
        sx={{
          padding: "11px 14px",
          borderBottom: "1px solid var(--border)",
          verticalAlign: "middle",
        }}
      >
        {ticket.assignee ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Box
              sx={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "8px",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                background: getAvatarStyle().bg,
                color: getAvatarStyle().color,
                flexShrink: 0,
              }}
            >
              {ticket.assignee.firstName?.[0]?.toUpperCase()}
              {ticket.assignee.lastName?.[0]?.toUpperCase()}
            </Box>
            <Box
              sx={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {ticket.assignee.firstName}{" "}
              {ticket.assignee.lastName?.[0]?.toUpperCase()}.
            </Box>
          </Box>
        ) : (
          <Box sx={{ fontSize: "12px", color: "var(--muted)" }}>—</Box>
        )}
      </Box>

      <Box
        component="td"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        sx={{
          padding: "6px 36px 6px 0",
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
            {
              icon: <DeleteOutlineOutlined sx={{ fontSize: 13 }} />,
              label: t("common.delete"),
              onClick: (e) => {
                e.stopPropagation();
                onDelete(ticket.id, ticket.reference);
              },
              color: "red",
            },
          ]}
        />
      </Box>
    </Box>
  );
};

export const TicketRow = React.memo(TicketRowComponent);
