import React from "react";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import { useNavigate } from "react-router-dom";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import MessageOutlined from "@mui/icons-material/MessageOutlined";
import ConfirmationNumberOutlined from "@mui/icons-material/ConfirmationNumberOutlined";
import { useT } from "@/i18n/I18nContext";
import {
  DashPalette,
  UrgentTicket,
  avatars,
  buildPanelSx,
  buildScrollSx,
  initials,
  ticketIcon,
  ticketPriority,
} from "../../helpers";
import { typeLabelKeys } from "@/features/tickets/pages/TicketDetailPage/helpers";

interface Props {
  urgent: UrgentTicket[];
  palette: DashPalette;
  isDark: boolean;
}

export const UrgentTicketsPanel: React.FC<Props> = React.memo(function UrgentTicketsPanel({
  urgent,
  palette,
  isDark,
}) {
  const t = useT();
  const navigate = useNavigate();

  const summary = (() => {
    if (urgent.length === 0) return t("dashboard.urgent_summary.empty");
    const counts = new Map<string, number>();
    const order: string[] = [];

    urgent.forEach((ticket) => {
      if (!counts.has(ticket.type)) order.push(ticket.type);
      counts.set(ticket.type, (counts.get(ticket.type) ?? 0) + 1);
    });

    const parts = order.map((type) => {
      const count = counts.get(type) ?? 0;
      const labelKey = typeLabelKeys[type];
      const label = labelKey ? t(labelKey) : type;
      return `${count} ${label}`;
    });

    return parts.join(" · ");
  })();

  return (
    <Box
      sx={{
        ...buildPanelSx(palette),
        gridColumn: "1",
        gridRow: "1 / 4",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          px: "18px",
          py: "12px",
          borderBottom: `1px solid ${palette.headerBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Box
            sx={{
              fontSize: "15px",
              lineHeight: 1.1,
              fontWeight: 700,
              color: palette.textHeading,
              letterSpacing: "-0.02em",
            }}
          >
            {t("dashboard.urgent.title")}
          </Box>
          <Box
            sx={{ mt: "6px", color: palette.textSecondary, fontSize: "11px" }}
          >
            {summary}
          </Box>
        </Box>
        <Box
          component="button"
          onClick={() => navigate("/tickets")}
          sx={{
            all: "unset",
            cursor: "pointer",
            color: palette.seeAll,
            fontSize: "11px",
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: "2px",
            transition: "color 120ms ease",
            textDecoration: "none",
            "&:hover, &:focus-visible": {
              color: "var(--accent2)",
            },
          }}
        >
          {t("dashboard.see_all")}{" "}
          <ChevronRightOutlined sx={{ fontSize: 18 }} />
        </Box>
      </Box>
      <Box
        sx={{
          p: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "7px",
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          ...buildScrollSx(palette),
        }}
      >
        {urgent.length === 0 ? (
          <Box className="empty-state" sx={{ flex: 1, padding: "24px !important" }}>
            <Box className="empty-state-icon">
              <ConfirmationNumberOutlined sx={{ fontSize: 32 }} />
            </Box>
            <Box className="empty-state-title" sx={{ fontSize: "12px !important" }}>
              {t("dashboard.urgent.empty_title")}
            </Box>
            <Box className="empty-state-subtitle" sx={{ fontSize: "11px !important" }}>
              {t("dashboard.urgent.empty_subtitle")}
            </Box>
          </Box>
        ) : Array.from({ length: 8 }).map((_, i) => {
          const ticket = urgent[i];
          if (!ticket)
            return <Box key={`urgent-empty-${i}`} sx={{ minHeight: "48px" }} />;
          const Icon = ticketIcon(ticket.type);
          const badge = ticketPriority(ticket.priority, isDark);
          const av = avatars[i % avatars.length];
          return (
            <Box
              key={ticket.id}
              component="button"
              onClick={() => navigate(`/tickets/${ticket.id}`)}
              sx={{
                all: "unset",
                cursor: "pointer",
                borderRadius: 'var(--r-md)',
                minHeight: "48px",
                px: "10px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: palette.rowBg,
                transition: "background 120ms ease, box-shadow 120ms ease",
                "&:hover": {
                  background: palette.rowHoverBg,
                  boxShadow: `0 0 0 1.5px ${palette.rowHoverRing}`,
                },
                "&:active": { background: palette.rowActiveBg },
              }}
            >
              <Icon
                sx={{
                  fontSize: 16,
                  color:
                    ticket.type === "security"
                      ? palette.typeIconSecurity
                      : ticket.type === "performance"
                        ? palette.typeIconPerformance
                        : palette.typeIconDefault,
                }}
              />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box
                  sx={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: palette.rowTitle,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {ticket.title}
                </Box>
                <Box
                  sx={{
                    mt: "2px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "10px",
                    color: palette.rowSub,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>{ticket.projectName ?? ticket.reference}</span>
                  <span
                    style={{
                      color: badge.color,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontWeight: 700,
                    }}
                  >
                    • {t(badge.labelKey)}
                  </span>
                  <span style={{ color: palette.bullet }}>•</span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <MessageOutlined
                      sx={{ fontSize: 12, color: palette.commentIcon }}
                    />
                    {ticket.commentCount ?? 0}
                  </span>
                </Box>
              </Box>
              <Tooltip
                title={ticket.assignedToName ?? ""}
                placement="top"
                arrow
                disableHoverListener={!ticket.assignedToName}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: av.bg,
                    color: av.text,
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                    fontSize: "10px",
                  }}
                >
                  {ticket.assignedToName ? initials(ticket.assignedToName) : "?"}
                </Box>
              </Tooltip>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
});
