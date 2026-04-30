import React from "react";
import Box from "@mui/material/Box";
import { useNavigate } from "react-router-dom";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import MessageOutlined from "@mui/icons-material/MessageOutlined";
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

interface Props {
  urgent: UrgentTicket[];
  palette: DashPalette;
  isDark: boolean;
}

export const UrgentTicketsPanel: React.FC<Props> = ({
  urgent,
  palette,
  isDark,
}) => {
  const t = useT();
  const navigate = useNavigate();

  const bugCount = urgent.filter((u) => u.type === "bug").length;
  const secCount = urgent.filter((u) => u.type === "security").length;

  const summary = (() => {
    if (urgent.length === 0) return t("dashboard.urgent_summary.empty");
    const parts: string[] = [];
    if (bugCount > 0)
      parts.push(
        `${bugCount} ${t(bugCount > 1 ? "dashboard.urgent_summary.bug_other" : "dashboard.urgent_summary.bug_one")}`,
      );
    if (secCount > 0)
      parts.push(
        `${secCount} ${t(secCount > 1 ? "dashboard.urgent_summary.security_other" : "dashboard.urgent_summary.security_one")}`,
      );
    const otherCount = urgent.length - bugCount - secCount;
    if (otherCount > 0)
      parts.push(
        `${otherCount} ${t(otherCount > 1 ? "dashboard.urgent_summary.other_other" : "dashboard.urgent_summary.other_one")}`,
      );
    return parts.join(" · ");
  })();

  return (
    <Box
      sx={{
        ...buildPanelSx(palette),
        gridColumn: "span 7",
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
        {Array.from({ length: 8 }).map((_, i) => {
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
                borderRadius: "12px",
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
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "999px",
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
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
