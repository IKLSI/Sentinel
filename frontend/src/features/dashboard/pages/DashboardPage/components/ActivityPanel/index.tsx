import React from "react";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
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

const TimelineDot: React.FC<{ color: string }> = ({ color }) => (
  <Box
    sx={{
      width: 12,
      height: 12,
      borderRadius: "50%",
      border: `1.5px solid ${color}`,
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      mt: "2px",
    }}
  >
    <Box
      sx={{
        width: 3,
        height: 3,
        borderRadius: "50%",
        bgcolor: color,
      }}
    />
  </Box>
);

export const ActivityPanel: React.FC<Props> = ({ activity, palette }) => {
  const t = useT();
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
          py: "12px",
          borderBottom: `1px solid ${palette.headerBorder}`,
        }}
      >
        <Box
          sx={{
            fontSize: "15px",
            lineHeight: 1.1,
            fontWeight: 600,
            color: palette.textHeading,
            letterSpacing: "-0.02em",
          }}
        >
          {t("dashboard.activity.title")}
        </Box>
        <Box sx={{ mt: "6px", color: palette.textSecondary, fontSize: "11px" }}>
          {t("dashboard.activity.realtime")}
        </Box>
      </Box>
      <Box
        sx={{
          p: "12px 16px",
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
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
              const danger = a.color === "red";
              const isCreated = a.color === "green";
              const accentColor = danger
                ? palette.activityDangerFg
                : isCreated
                  ? palette.activityCreatedFg
                  : palette.activityOkFg;
              const boldPrefix = danger
                ? t("dashboard.activity.bold_critical")
                : isCreated
                  ? t("dashboard.activity.bold_created")
                  : t("dashboard.activity.bold_resolved");
              const hasBoldPrefix = a.text.startsWith(boldPrefix);
              const afterPrefix = hasBoldPrefix
                ? a.text.slice(boldPrefix.length)
                : a.text;
              const dashIdx = afterPrefix.indexOf(" — ");
              const surIdx = dashIdx < 0 ? afterPrefix.indexOf(" sur ") : -1;
              const midText = dashIdx >= 0
                ? afterPrefix.slice(0, dashIdx + 3)
                : surIdx >= 0 ? afterPrefix.slice(0, surIdx + 5) : afterPrefix;
              const boldSuffix = dashIdx >= 0
                ? afterPrefix.slice(dashIdx + 3)
                : surIdx >= 0 ? afterPrefix.slice(surIdx + 5) : "";
              const isLast = idx === activity.length - 1;

              return (
                <Box
                  key={`${a.timestamp}-${a.text}-${idx}`}
                  sx={{ display: "flex", gap: "12px" }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      flexShrink: 0,
                      width: 12,
                    }}
                  >
                    <TimelineDot color={accentColor} />
                    {!isLast && (
                      <Box
                        sx={{
                          width: "1px",
                          flex: 1,
                          minHeight: "12px",
                          bgcolor: palette.activityDivider,
                          mt: "4px",
                        }}
                      />
                    )}
                  </Box>
                  <Box sx={{ minWidth: 0, pb: isLast ? 0 : "14px" }}>
                    <Tooltip
                      title={a.tooltipText ?? ""}
                      disableHoverListener={!a.tooltipText}
                      placement="top"
                      arrow
                    >
                      <Box
                        sx={{
                          fontSize: "12px",
                          color: palette.textPrimary,
                          lineHeight: 1.4,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {hasBoldPrefix ? (
                          <>
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
                    </Tooltip>
                    <Box
                      sx={{
                        mt: "1px",
                        fontSize: "11px",
                        color: palette.activityDetail,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {a.detail}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
};
