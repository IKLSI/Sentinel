import React from "react";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useT } from "@/i18n/I18nContext";
import {
  ActivityItem,
  DashPalette,
  buildPanelSx,
  buildScrollSx,
} from "../../helpers";

interface Props {
  activity: ActivityItem[];
  palette: DashPalette;
}

const DOT_COLORS: Record<string, string> = {
  red: "var(--red)",
  green: "var(--green)",
  accent: "var(--accent)",
};

export const ActivityPanel: React.FC<Props> = ({ activity, palette }) => {
  const t = useT();
  const navigate = useNavigate();

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
          py: "10px",
          borderBottom: `1px solid ${palette.headerBorder}`,
        }}
      >
        <Box
          sx={{
            fontSize: "13px",
            lineHeight: 1.1,
            fontWeight: 600,
            color: palette.textSecondary,
            letterSpacing: "-0.01em",
          }}
        >
          {t("dashboard.activity.title")}
        </Box>
        <Box sx={{ mt: "3px", color: palette.textMuted, fontSize: "11px" }}>
          {t("dashboard.activity.realtime")}
        </Box>
      </Box>
      <Box
        sx={{
          p: "10px",
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          ...buildScrollSx(palette),
        }}
      >
        {activity.length === 0 ? (
          <Box className="empty-state" sx={{ flex: 1, padding: "24px !important" }}>
            <Box className="empty-state-icon">
              <HistoryOutlined sx={{ fontSize: 32 }} />
            </Box>
            <Box className="empty-state-title" sx={{ fontSize: "12px !important" }}>
              {t("dashboard.activity.empty_title")}
            </Box>
            <Box className="empty-state-subtitle" sx={{ fontSize: "11px !important" }}>
              {t("dashboard.activity.empty_subtitle")}
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {activity.map((a, idx) => {
              const accentColor = DOT_COLORS[a.color] ?? "var(--accent)";
              const danger = a.color === "red";
              const isCreated = a.color === "green";
              const boldPrefix = danger
                ? a.count != null
                  ? t("dashboard.activity.bold_critical_plural")
                  : t("dashboard.activity.bold_critical")
                : isCreated
                  ? t("dashboard.activity.bold_created")
                  : t("dashboard.activity.bold_resolved");
              const hasBoldPrefix = a.text.startsWith(boldPrefix);
              const afterPrefix = hasBoldPrefix ? a.text.slice(boldPrefix.length) : a.text;
              const dashIdx = afterPrefix.indexOf(" — ");
              const surIdx = dashIdx < 0 ? afterPrefix.indexOf(" sur ") : -1;
              const midText = dashIdx >= 0
                ? afterPrefix.slice(0, dashIdx + 3)
                : surIdx >= 0 ? afterPrefix.slice(0, surIdx + 5) : afterPrefix;
              const boldSuffix = dashIdx >= 0
                ? afterPrefix.slice(dashIdx + 3)
                : surIdx >= 0 ? afterPrefix.slice(surIdx + 5) : "";
              const href = a.ticketId
                ? `/tickets/${a.ticketId}`
                : a.projectId
                  ? `/projects/${a.projectId}`
                  : null;

              return (
                <Tooltip
                  key={`${a.timestamp}-${a.text}-${idx}`}
                  title={a.tooltipText ?? ""}
                  disableHoverListener={!a.tooltipText}
                  placement="top"
                  arrow
                >
                  <Box
                    onClick={href ? () => navigate(href) : undefined}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      px: "10px",
                      minHeight: "48px",
                      borderRadius: "var(--r-md)",
                      background: palette.rowBg,
                      cursor: href ? "pointer" : "default",
                      transition: "background 120ms ease, box-shadow 120ms ease",
                      "&:hover": href ? {
                        background: palette.rowHoverBg,
                        boxShadow: `0 0 0 1.5px ${palette.rowHoverRing}`,
                      } : undefined,
                      "&:active": href ? { background: palette.rowActiveBg } : undefined,
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          fontSize: "11px",
                          color: palette.textPrimary,
                          lineHeight: 1.4,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {hasBoldPrefix ? (
                          <>
                            {a.count != null && (
                              <Box component="span" sx={{ fontWeight: 600, color: accentColor }}>
                                {a.count}&nbsp;
                              </Box>
                            )}
                            <Box component="span" sx={{ fontWeight: 600, color: accentColor }}>
                              {boldPrefix}
                            </Box>
                            <Box component="span">{midText}</Box>
                            {boldSuffix && (
                              <Box component="span" sx={{ fontWeight: 600 }}>
                                {boldSuffix}
                              </Box>
                            )}
                          </>
                        ) : (
                          <Box component="span">{a.text}</Box>
                        )}
                      </Box>
                      {a.detail && (
                        <Box
                          sx={{
                            mt: "2px",
                            fontSize: "10px",
                            color: palette.activityDetail,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {a.detail}
                        </Box>
                      )}
                    </Box>
                    {a.timestamp && (
                      <Box
                        sx={{
                          fontSize: "10px",
                          color: palette.textMuted,
                          flexShrink: 0,
                          fontVariantNumeric: "tabular-nums",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDistanceToNow(new Date(a.timestamp), { addSuffix: true, locale: fr })}
                      </Box>
                    )}
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
};
