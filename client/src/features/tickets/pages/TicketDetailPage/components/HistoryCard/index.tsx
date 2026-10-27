import type React from "react";
import Box from "@mui/material/Box";
import { useI18n } from "@/contexts/I18nContext";
import type { Ticket } from "@/domains/tickets/types";
import { DETAIL_PALETTE } from "@/features/tickets/pages/TicketDetailPage/constants";
import {
  getRelativeShort,
  historyPresentation,
} from "@/features/tickets/pages/TicketDetailPage/helpers";

interface Props {
  ticket: Ticket;
}

export const HistoryCard: React.FC<Props> = ({ ticket }) => {
  const { t, culture } = useI18n();
  return (
    <Box
      sx={{
        border: `1px solid ${DETAIL_PALETTE.panelBorder}`,
        borderRadius: "var(--r-xl)",
        background: DETAIL_PALETTE.panelBg,
        boxShadow: DETAIL_PALETTE.panelShadow,
        p: "8px 6px 4px",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          px: "10px",
          pt: "4px",
          pb: "6px",
          typography: "label",
          color: DETAIL_PALETTE.muted,
        }}
      >
        {t("tickets.detail.section_history")}
      </Box>
      <Box
        sx={{ position: "relative", px: "10px", pb: "6px", overflowY: "auto" }}
      >
        {ticket.history.length > 0 && (
          <Box
            sx={{
              position: "absolute",
              left: "13px",
              top: "14px",
              bottom: "14px",
              width: "2px",
              background: DETAIL_PALETTE.historyTimeline,
            }}
          />
        )}

        {[...ticket.history]
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .map((h) => {
            const event = historyPresentation(h, t, ticket);
            return (
              <Box
                key={h.id}
                sx={{
                  display: "flex",
                  gap: "8px",
                  mb: "8px",
                  position: "relative",
                }}
              >
                <Box
                  sx={{
                    width: "8px",
                    height: "8px",
                    mt: "8px",
                    borderRadius: "50%",
                    background: event.tone.dot,
                    border: `2px solid ${DETAIL_PALETTE.historyDotBorder}`,
                    boxShadow: `0 0 0 2px ${event.tone.ring}`,
                    zIndex: 1,
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0, pt: "2px" }}>
                  <Box
                    sx={{
                      fontSize: "11px",
                      color: DETAIL_PALETTE.historyMsg,
                      lineHeight: 1.35,
                    }}
                  >
                    {event.message}
                  </Box>
                  <Box
                    sx={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      color: DETAIL_PALETTE.historySub,
                      mt: "4px",
                    }}
                  >
                    {getRelativeShort(h.createdAt, t, culture)} ·{" "}
                    {h.userName || t("tickets.history.system")}
                  </Box>
                </Box>
              </Box>
            );
          })}

        {ticket.history.length === 0 && (
          <Box
            sx={{ color: DETAIL_PALETTE.muted, fontSize: "13px", py: "4px" }}
          >
            {t("tickets.detail.no_history")}
          </Box>
        )}
      </Box>
    </Box>
  );
};
