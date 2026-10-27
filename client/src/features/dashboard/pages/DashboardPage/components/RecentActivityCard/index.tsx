import type React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import AddOutlined from "@mui/icons-material/AddOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import ReportProblemOutlined from "@mui/icons-material/ReportProblemOutlined";
import { useNavigate } from "@tanstack/react-router";
import { EmptyState } from "@/components/ui/common/feedback/EmptyState";
import { TEXT_ELLIPSIS_SX } from "@/constants/display";
import { useI18n } from "@/contexts/I18nContext";
import type { ActivityItem } from "@/domains/dashboard/types";
import { DashboardCard } from "@/features/dashboard/pages/DashboardPage/components/DashboardCard";
import {
  DASHBOARD_ACTIVITY_LIMIT,
  DASHBOARD_ROW_SX,
} from "@/features/dashboard/pages/DashboardPage/constants";
import {
  activityDetail,
  activityEmphasis,
  activitySuffix,
  activityTarget,
} from "@/features/dashboard/pages/DashboardPage/helpers";
import { formatElapsed } from "@/formatters/date";

interface Props {
  activity: ActivityItem[];
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

const activityKey = (item: ActivityItem) =>
  `${item.timestamp}-${item.type ?? ""}-${item.ticketId ?? ""}-${item.projectId ?? ""}`;

export const RecentActivityCard: React.FC<Props> = ({ activity }) => {
  const { t, culture } = useI18n();
  const navigate = useNavigate();

  return (
    <DashboardCard
      title={t("dashboard.activity.title")}
      subtitle={t("dashboard.activity.realtime")}
    >
      {activity.length === 0 ? (
        <EmptyState
          icon={HistoryOutlined}
          title={t("dashboard.activity.empty_title")}
          subtitle={t("dashboard.activity.empty_subtitle")}
          sx={{ flex: 1 }}
        />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {activity.slice(0, DASHBOARD_ACTIVITY_LIMIT).map((item) => {
            const color = TONE_COLORS[item.color] ?? TONE_COLORS.accent;
            const Icon =
              ICONS[item.type as keyof typeof ICONS] ?? HistoryOutlined;
            const detail = activityDetail(t, item);
            const target = activityTarget(item);

            return (
              <ButtonBase
                key={activityKey(item)}
                disabled={!target}
                onClick={() => target && navigate(target)}
                sx={{
                  ...DASHBOARD_ROW_SX,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  "&.Mui-disabled": { opacity: 1 },
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
                      ...TEXT_ELLIPSIS_SX,
                    }}
                  >
                    <Box component="span" sx={{ fontWeight: 700 }}>
                      {activityEmphasis(t, item)}
                    </Box>
                    {activitySuffix(t, item)}
                  </Box>
                  {detail && (
                    <Box
                      sx={{
                        mt: "2px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "9.5px",
                        color: "var(--muted2)",
                        ...TEXT_ELLIPSIS_SX,
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
          })}
        </Box>
      )}
    </DashboardCard>
  );
};
