import React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/i18n/I18nContext";
import { Ticket } from "@/types";
import {
  DetailPalette,
  buildPriorityConfig,
  buildStatusConfig,
  getRelativeShort,
  historyPresentation,
} from "../../helpers";

interface Props {
  ticket: Ticket;
  palette: DetailPalette;
  isDark: boolean;
  statusConfig: ReturnType<typeof buildStatusConfig>;
  priorityConfig: ReturnType<typeof buildPriorityConfig>;
}

export const HistoryCard: React.FC<Props> = ({
  ticket,
  palette,
  isDark,
  statusConfig,
  priorityConfig,
}) => {
  const t = useT();
  return (
    <Box
      sx={{
        border: `1px solid ${palette.panelBorder}`,
        borderRadius: 'var(--r-xl)',
        background: palette.panelBg,
        boxShadow: palette.panelShadow,
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
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          fontWeight: 800,
          color: palette.muted,
          fontSize: "10px",
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
              background: palette.historyTimeline,
            }}
          />
        )}

        {[...ticket.history]
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .map((h) => {
            const event = historyPresentation(
              h,
              t,
              isDark,
              statusConfig,
              priorityConfig,
              ticket,
            );
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
                    borderRadius: '50%',
                    background: event.tone.dot,
                    border: `2px solid ${palette.historyDotBorder}`,
                    boxShadow: `0 0 0 2px ${event.tone.ring}`,
                    zIndex: 1,
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0, pt: "2px" }}>
                  <Box
                    sx={{
                      fontSize: "11px",
                      color: palette.historyMsg,
                      lineHeight: 1.35,
                    }}
                  >
                    {event.message}
                  </Box>
                  <Box
                    sx={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      color: palette.historySub,
                      mt: "4px",
                    }}
                  >
                    {getRelativeShort(h.createdAt, t)} · {h.author.firstName}{" "}
                    {h.author.lastName}
                  </Box>
                </Box>
              </Box>
            );
          })}

        {ticket.history.length === 0 && (
          <Box sx={{ color: palette.muted, fontSize: "13px", py: "4px" }}>
            {t("tickets.detail.no_history")}
          </Box>
        )}
      </Box>
    </Box>
  );
};
