import type React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import AddOutlined from "@mui/icons-material/AddOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import ReportProblemOutlined from "@mui/icons-material/ReportProblemOutlined";
import { useNavigate } from "@tanstack/react-router";
import { useI18n } from "@/contexts/I18nContext";
import type { ActivityItem } from "@/domains/dashboard/types";
import { formatElapsed } from "@/formatters/date";

interface Props {
  item: ActivityItem;
}

const TONE_COLORS: Record<string, string> = {
  red: "var(--red)",
  green: "var(--green)",
  accent: "var(--accent)",
};

const ICONS = {
  resolved: CheckOutlined,
  created: AddOutlined,
  vuln: ReportProblemOutlined,
} as const;

const CVSS_DECIMALS = 1;

const ellipsis = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
} as const;

export const ActivityRow: React.FC<Props> = ({ item }) => {
  const { t, culture } = useI18n();
  const navigate = useNavigate();
  const color = TONE_COLORS[item.color] ?? TONE_COLORS.accent;
  const Icon = ICONS[item.type as keyof typeof ICONS] ?? HistoryOutlined;
  const count = item.count ?? 0;
  const isPlural = count > 1;

  const emphasis = (() => {
    if (item.type === "resolved")
      return isPlural
        ? t("dashboard.activity.bold_resolved_plural", { count })
        : t("dashboard.activity.bold_resolved");
    if (item.type === "created")
      return isPlural
        ? t("dashboard.activity.bold_created_plural", { count })
        : t("dashboard.activity.bold_created");
    if (item.type === "vuln")
      return isPlural
        ? `${count} ${t("dashboard.activity.bold_critical_plural")}`
        : t("dashboard.activity.bold_critical");
    return "";
  })();

  const suffix = (() => {
    const reference = item.reference ?? "";
    const project = item.projectName ?? "";
    if (item.type === "resolved")
      return isPlural
        ? ""
        : t("dashboard.activity.suffix_resolved", { reference });
    if (item.type === "created")
      return isPlural
        ? ""
        : t("dashboard.activity.suffix_created", { reference });
    if (item.type === "vuln")
      return t(
        isPlural
          ? "dashboard.activity.suffix_vuln_plural"
          : "dashboard.activity.suffix_vuln",
        { project },
      );
    return item.detail ?? "";
  })();

  const otherCount = item.vulnOtherCount ?? 0;
  const vulnDetailKey =
    otherCount > 1
      ? "dashboard.activity.vuln_detail_more_plural"
      : otherCount === 1
        ? "dashboard.activity.vuln_detail_more"
        : "dashboard.activity.vuln_detail_single";

  const detail =
    item.type === "vuln" && item.vulnCveId
      ? t(vulnDetailKey, {
          project: item.projectName ?? "",
          count: otherCount,
          cvss: item.vulnCvssScore?.toFixed(CVSS_DECIMALS) ?? "",
        })
      : item.type === "vuln"
        ? null
        : item.detail;

  const target = item.ticketId
    ? ({ to: "/tickets/$id", params: { id: item.ticketId } } as const)
    : item.projectId
      ? ({ to: "/projects/$id", params: { id: item.projectId } } as const)
      : null;

  return (
    <ButtonBase
      disabled={!target}
      onClick={() => target && navigate(target)}
      sx={{
        width: "100%",
        minHeight: 48,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        px: "10px",
        textAlign: "left",
        borderRadius: "var(--r-md)",
        "&:hover": {
          background: "var(--accent-subtle)",
          boxShadow: "inset 0 0 0 1.5px var(--accent-border)",
        },
        "&.Mui-disabled": { opacity: 1 },
        "&.Mui-focusVisible": { outline: "2px solid var(--accent)" },
      }}
    >
      <Icon sx={{ fontSize: 16, color, flexShrink: 0 }} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box
          sx={{
            fontSize: "12px",
            fontWeight: 600,
            lineHeight: 1.4,
            letterSpacing: "-0.01em",
            color: "var(--text)",
            ...ellipsis,
          }}
        >
          <Box component="span" sx={{ fontWeight: 700 }}>
            {emphasis}
          </Box>
          {suffix}
        </Box>
        {detail && (
          <Box
            sx={{
              mt: "2px",
              fontFamily: "var(--font-mono)",
              fontSize: "9.5px",
              color: "var(--muted2)",
              ...ellipsis,
            }}
          >
            {detail}
          </Box>
        )}
      </Box>
      <Box
        component="time"
        dateTime={item.timestamp}
        sx={{
          fontSize: "10px",
          color: "var(--muted2)",
          flexShrink: 0,
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}
      >
        {formatElapsed(item.timestamp, culture)}
      </Box>
    </ButtonBase>
  );
};
