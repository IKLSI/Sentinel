import React from "react";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import ErrorOutlineOutlined from "@mui/icons-material/ErrorOutlineOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
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

export const ActivityPanel: React.FC<Props> = ({ activity, palette }) => {
  const t = useT();
  return (
    <Box
      sx={{
        ...buildPanelSx(palette),
        gridColumn: "span 5",
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
            fontWeight: 700,
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
          p: "8px 14px",
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          ...buildScrollSx(palette),
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          {activity.map((a, idx) => {
            const danger = a.color === "red";
            const accentColor = danger
              ? palette.activityDangerFg
              : palette.activityOkFg;
            const boldPrefix = danger
              ? t("dashboard.activity.bold_critical")
              : t("dashboard.activity.bold_resolved");
            const rest = a.text.startsWith(boldPrefix)
              ? a.text.slice(boldPrefix.length)
              : a.text;
            const hasBoldPrefix = a.text.startsWith(boldPrefix);
            return (
              <React.Fragment key={`${a.timestamp}-${a.text}-${idx}`}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    minHeight: "48px",
                  }}
                >
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: "linear-gradient(135deg,#f6ced5,#eaa8b6)",
                      color: accentColor,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                      zIndex: 1,
                    }}
                  >
                    {danger ? (
                      <ErrorOutlineOutlined sx={{ fontSize: 14 }} />
                    ) : (
                      <CheckOutlined sx={{ fontSize: 14 }} />
                    )}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Tooltip
                      title={a.tooltipText ?? ""}
                      disableHoverListener={!a.tooltipText}
                      placement="top"
                      arrow
                    >
                      <Box
                        sx={{
                          fontSize: "11px",
                          color: palette.textPrimary,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {hasBoldPrefix ? (
                          <>
                            <Box
                              component="span"
                              sx={{ fontWeight: 700, color: accentColor }}
                            >
                              {boldPrefix}
                            </Box>
                            <span>{rest}</span>
                          </>
                        ) : (
                          <Box component="span" sx={{ fontWeight: 700 }}>
                            {a.text}
                          </Box>
                        )}
                      </Box>
                    </Tooltip>
                    <Box
                      sx={{
                        mt: "1px",
                        fontSize: "10px",
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
                {idx < activity.length - 1 && (
                  <Box
                    sx={{
                      width: "1px",
                      height: "16px",
                      bgcolor: palette.activityDivider,
                      ml: "13px",
                      flexShrink: 0,
                      my: "-4.5px",
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};
