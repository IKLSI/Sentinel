import React from "react";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import ReportProblemOutlined from "@mui/icons-material/ReportProblemOutlined";
import { formatDistanceToNow } from "date-fns";
import { fr, enUS, type Locale } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/i18n/I18nContext";
import { Language } from "@/types/enums";
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

const activityIcon = (type?: string) => {
  if (type === "resolved") return CheckOutlined;
  if (type === "created") return AddOutlined;
  if (type === "vuln") return ReportProblemOutlined;
  return HistoryOutlined;
};

const DATE_FNS_LOCALE: Record<string, Locale> = {
  [Language.Fr]: fr,
  [Language.En]: enUS,
};

export const ActivityPanel: React.FC<Props> = ({ activity, palette }) => {
  const { t, culture } = useI18n();
  const navigate = useNavigate();
  const dateFnsLocale = DATE_FNS_LOCALE[culture] ?? fr;

  return (
    <Box
      sx={{
        ...buildPanelSx(palette),
        gridColumn: "2",
        gridRow: "2",
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
        }}
      >
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
              const href = a.ticketId
                ? `/tickets/${a.ticketId}`
                : a.projectId
                  ? `/projects/${a.projectId}`
                  : null;

              const renderText = () => {
                if (a.type === "resolved") {
                  return (
                    <>
                      <Box component="span" sx={{ fontWeight: 700, color: accentColor }}>
                        {t("dashboard.activity.bold_resolved")}
                      </Box>
                      {t("dashboard.activity.suffix_resolved", { reference: a.reference ?? "" })}
                    </>
                  );
                }
                if (a.type === "created") {
                  return (
                    <>
                      <Box component="span" sx={{ fontWeight: 700, color: accentColor }}>
                        {t("dashboard.activity.bold_created")}
                      </Box>
                      {t("dashboard.activity.suffix_created", { reference: a.reference ?? "" })}
                    </>
                  );
                }
                if (a.type === "vuln") {
                  const isPlural = a.count != null && a.count > 1;
                  return (
                    <>
                      {isPlural && (
                        <Box component="span" sx={{ fontWeight: 700, color: accentColor }}>
                          {a.count}&nbsp;
                        </Box>
                      )}
                      <Box component="span" sx={{ fontWeight: 700, color: accentColor }}>
                        {isPlural
                          ? t("dashboard.activity.bold_critical_plural")
                          : t("dashboard.activity.bold_critical")}
                      </Box>
                      {isPlural
                        ? t("dashboard.activity.suffix_vuln_plural", { project: a.projectName ?? "" })
                        : t("dashboard.activity.suffix_vuln", { project: a.projectName ?? "" })}
                    </>
                  );
                }
                return <Box component="span">{a.text}</Box>;
              };

              const renderDetail = () => {
                if (a.type === "vuln" && a.vulnCveId) {
                  if (a.vulnOtherCount != null && a.vulnOtherCount > 0) {
                    const key = a.vulnOtherCount > 1
                      ? "dashboard.activity.vuln_detail_more_plural"
                      : "dashboard.activity.vuln_detail_more";
                    return t(key, {
                      cve: a.vulnCveId,
                      count: a.vulnOtherCount,
                      cvss: a.vulnCvssScore?.toFixed(1) ?? "",
                    });
                  }
                  return t("dashboard.activity.vuln_detail_single", {
                    cve: a.vulnCveId,
                    cvss: a.vulnCvssScore?.toFixed(1) ?? "",
                  });
                }
                return a.detail ?? null;
              };

              const detail = renderDetail();
              const Icon = activityIcon(a.type);

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
                    <Icon sx={{ fontSize: 16, color: accentColor, flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: palette.rowTitle,
                          letterSpacing: "-0.01em",
                          lineHeight: 1.4,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {renderText()}
                      </Box>
                      {detail && (
                        <Box
                          sx={{
                            mt: "2px",
                            fontFamily: "var(--font-mono)",
                            fontSize: "9.5px",
                            color: palette.textMuted,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {detail}
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
                        {formatDistanceToNow(new Date(a.timestamp), { addSuffix: true, locale: dateFnsLocale })}
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
