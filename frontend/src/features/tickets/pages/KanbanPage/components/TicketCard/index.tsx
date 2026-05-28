import React from "react";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import CommentOutlined from "@mui/icons-material/CommentOutlined";
import LockOutlined from "@mui/icons-material/LockOutlined";
import { useT } from "@/i18n/I18nContext";
import { KanbanTicket, typeIcons, typeLabelKeys } from "../../helpers";

interface Props {
  ticket: KanbanTicket;
  isDragging?: boolean;
  updatingId: string | null;
  onCardClick: (id: string) => void;
}

export const TicketCard: React.FC<Props> = React.memo(function TicketCard({
  ticket,
  isDragging = false,
  updatingId,
  onCardClick,
}) {
  const t = useT();
  const isUpdating = updatingId === ticket.id;

  return (
    <Box
      onClick={() => onCardClick(ticket.id)}
      sx={{
        background: isUpdating ? "var(--accent-subtle)" : "var(--s1)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
        padding: "11px 12px",
        overflow: "hidden",
        cursor: isDragging ? "grabbing" : "pointer",
        boxShadow: "none",
        userSelect: "none",
        opacity: isUpdating ? 0.5 : 1,
        transition: "opacity 0.15s, border-color 0.15s",
        "&:hover": !isDragging
          ? {
              borderColor: "var(--border2)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
            }
          : {},
      }}
    >
      <Box sx={{ mb: "8px" }}>
        <Box
          component="span"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
            fontSize: "10px",
            fontWeight: 600,
            color: "var(--text-secondary)",
            background: "color-mix(in srgb, var(--muted2) 8%, transparent)",
            borderRadius: 'var(--r-xs)',
            padding: "2px 7px 2px 5px",
          }}
        >
          {typeIcons[ticket.type]}
          {t(typeLabelKeys[ticket.type])}
        </Box>
      </Box>

      <Box
        sx={{
          fontSize: "13px",
          fontWeight: 600,
          lineHeight: "1.45",
          color: "var(--text)",
          mb: "9px",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          letterSpacing: "-0.015em",
        }}
      >
        {ticket.title}
      </Box>

      {ticket.project && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            mb: "9px",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <FolderOutlined
            sx={{ fontSize: 10, color: "var(--muted2)", flexShrink: 0 }}
          />
          <Box
            component="span"
            sx={{
              fontSize: "10.5px",
              color: "var(--muted2)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {ticket.project}
          </Box>
        </Box>
      )}

      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            flex: 1,
            minWidth: 0,
          }}
        >
          <Box
            component="span"
            sx={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--muted)",
              letterSpacing: "0.03em",
              flexShrink: 0,
            }}
          >
            {ticket.reference}
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            flexShrink: 0,
          }}
        >
          {ticket.isInternal && (
            <Tooltip
              title={t("tickets.kanban.card.internal_tooltip")}
              placement="top"
              arrow
            >
              <LockOutlined sx={{ fontSize: 12, color: "var(--muted2)" }} />
            </Tooltip>
          )}

          {ticket.commentCount > 0 && (
            <Tooltip
              title={
                ticket.commentCount > 1
                  ? t("tickets.kanban.card.comments_plural", {
                      count: ticket.commentCount,
                    })
                  : t("tickets.kanban.card.comments_singular", {
                      count: ticket.commentCount,
                    })
              }
              placement="top"
              arrow
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  fontSize: "10px",
                  color: "var(--muted2)",
                }}
              >
                <CommentOutlined sx={{ fontSize: 11 }} />
                {ticket.commentCount}
              </Box>
            </Tooltip>
          )}

          {ticket.assigneeInitials && (
            <Tooltip
              title={ticket.assigneeName ?? ticket.assigneeInitials}
              placement="top"
              arrow
            >
              <Box
                sx={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,var(--prio-bg-1),var(--prio-bg-2))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "8.5px",
                  fontWeight: 700,
                  color: "var(--prio-fg)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {ticket.assigneeInitials}
              </Box>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );
});
