import React from "react";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import { useNavigate } from "@tanstack/react-router";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import MessageOutlined from "@mui/icons-material/MessageOutlined";
import PersonOffOutlined from "@mui/icons-material/PersonOffOutlined";
import ConfirmationNumberOutlined from "@mui/icons-material/ConfirmationNumberOutlined";
import { useT } from "@/contexts/I18nContext";
import { ROUTES } from "@/constants/routes";
import { EmptyState } from "@/components/ui/common/EmptyState";
import type { UrgentTicket } from "@/domains/dashboard/types";
import {
  type DashPalette,
  avatars,
  buildPanelSx,
  buildScrollSx,
  initials,
  ticketIcon,
  ticketPriority,
} from "@/features/dashboard/pages/DashboardPage/helpers";
import { typeLabelKeys } from "@/features/tickets/pages/TicketDetailPage/helpers";

interface Props {
  urgent: UrgentTicket[];
  palette: DashPalette;
  isDark: boolean;
}

export const UrgentTicketsPanel: React.FC<Props> = React.memo(
  function UrgentTicketsPanel({ urgent, palette, isDark }) {
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
          gridColumn: "2",
          gridRow: "1",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            px: "18px",
            pt: "14px",
            pb: "10px",
            borderBottom: `1px solid ${palette.headerBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Box
              sx={{
                fontSize: "11.5px",
                lineHeight: 1.1,
                fontWeight: 700,
                color: palette.textHeading,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {t("dashboard.urgent.title")}
            </Box>
            <Box sx={{ mt: "3px", color: palette.textMuted, fontSize: "11px" }}>
              {summary}
            </Box>
          </Box>
          <Box
            component="button"
            onClick={() => navigate({ to: ROUTES.TICKETS })}
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
            <EmptyState
              icon={ConfirmationNumberOutlined}
              title={t("dashboard.urgent.empty_title")}
              subtitle={t("dashboard.urgent.empty_subtitle")}
              sx={{
                flex: 1,
                "& .empty-state-title": { fontSize: "12px !important" },
                "& .empty-state-subtitle": { fontSize: "11px !important" },
              }}
            />
          ) : (
            urgent.map((ticket, i) => {
              const Icon = ticketIcon(ticket.type);
              const badge = ticketPriority(ticket.priority, isDark);
              const av = avatars[i % avatars.length];
              return (
                <Box
                  key={ticket.id}
                  component="button"
                  onClick={() =>
                    navigate({ to: "/tickets/$id", params: { id: ticket.id } })
                  }
                  sx={{
                    all: "unset",
                    cursor: "pointer",
                    borderRadius: "var(--r-md)",
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
                    title={
                      ticket.assignedToName ?? t("dashboard.urgent.unassigned")
                    }
                    placement="top"
                    arrow
                  >
                    {ticket.assignedToName ? (
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: av.bg,
                          color: av.text,
                          fontWeight: 700,
                          display: "grid",
                          placeItems: "center",
                          fontSize: "10px",
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
                          border: `1.5px dashed ${palette.bullet}`,
                          color: palette.textMuted,
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <PersonOffOutlined sx={{ fontSize: 14 }} />
                      </Box>
                    )}
                  </Tooltip>
                </Box>
              );
            })
          )}
        </Box>
      </Box>
    );
  },
);
