import type React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import BoltOutlined from "@mui/icons-material/BoltOutlined";
import BugReportOutlined from "@mui/icons-material/BugReportOutlined";
import MessageOutlined from "@mui/icons-material/MessageOutlined";
import PersonOffOutlined from "@mui/icons-material/PersonOffOutlined";
import SecurityOutlined from "@mui/icons-material/SecurityOutlined";
import { useNavigate } from "@tanstack/react-router";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { useI18n } from "@/contexts/I18nContext";
import type { UrgentTicket } from "@/domains/dashboard/types";

interface Props {
  ticket: UrgentTicket;
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: "var(--red)",
  high: "var(--orange)",
  medium: "var(--accent)",
  low: "var(--green)",
};

const TYPE_ICONS = {
  security: { Icon: SecurityOutlined, color: "var(--red)" },
  performance: { Icon: BoltOutlined, color: "var(--yellow)" },
} as const;

const DEFAULT_TYPE_ICON = { Icon: BugReportOutlined, color: "var(--muted2)" };

const INITIALS_LENGTH = 2;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, INITIALS_LENGTH)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const ellipsis = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
} as const;

export const UrgentTicketRow: React.FC<Props> = ({ ticket }) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const priorityColor = PRIORITY_COLORS[ticket.priority] ?? "var(--muted2)";
  const { Icon, color: iconColor } =
    TYPE_ICONS[ticket.type as keyof typeof TYPE_ICONS] ?? DEFAULT_TYPE_ICON;

  return (
    <ButtonBase
      onClick={() =>
        navigate({ to: "/tickets/$id", params: { id: ticket.id } })
      }
      sx={{
        width: "100%",
        minHeight: 48,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        px: "10px",
        textAlign: "left",
        borderRadius: "var(--r-md)",
        "&:hover": {
          background: "var(--accent-subtle)",
          boxShadow: "inset 0 0 0 1.5px var(--accent-border)",
        },
        "&.Mui-focusVisible": { outline: "2px solid var(--accent)" },
      }}
    >
      <Icon sx={{ fontSize: 16, color: iconColor, flexShrink: 0 }} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box
          sx={{
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--text)",
            ...ellipsis,
          }}
          title={ticket.title}
        >
          {ticket.reference}
        </Box>
        <Box
          sx={{
            mt: "2px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "10px",
            color: "var(--text-secondary)",
            whiteSpace: "nowrap",
          }}
        >
          <span>{ticket.projectName ?? ticket.title}</span>
          <Box
            component="span"
            sx={{
              color: priorityColor,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 700,
            }}
          >
            • {t(`dashboard.tickets.priority.${ticket.priority}`)}
          </Box>
          <Box component="span" sx={{ color: "var(--border2)" }}>
            •
          </Box>
          <Box
            component="span"
            sx={{ display: "inline-flex", alignItems: "center", gap: "3px" }}
          >
            {ticket.commentCount}
            <MessageOutlined sx={{ fontSize: 12, color: "var(--muted2)" }} />
          </Box>
        </Box>
      </Box>
      <AppTooltip
        title={ticket.assignedToName ?? t("dashboard.tickets.unassigned")}
      >
        {ticket.assignedToName ? (
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--accent-subtle)",
              color: "var(--accent)",
              fontWeight: 700,
              display: "grid",
              placeItems: "center",
              fontSize: "10px",
              flexShrink: 0,
            }}
          >
            {initials(ticket.assignedToName)}
          </Box>
        ) : (
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "1.5px dashed var(--border2)",
              color: "var(--muted2)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <PersonOffOutlined sx={{ fontSize: 14 }} />
          </Box>
        )}
      </AppTooltip>
    </ButtonBase>
  );
};
