import type React from "react";
import Box from "@mui/material/Box";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import { EmptyState } from "@/components/ui/common/EmptyState";
import { useI18n } from "@/contexts/I18nContext";
import type { ActivityItem } from "@/domains/dashboard/types";
import { ActivityRow } from "@/features/dashboard/pages/DashboardPage/components/ActivityRow";
import { DashboardCard } from "@/features/dashboard/pages/DashboardPage/components/DashboardCard";
import { DASHBOARD_ACTIVITY_LIMIT } from "@/features/dashboard/pages/DashboardPage/constants";

interface Props {
  activity: ActivityItem[];
}

export const RecentActivityCard: React.FC<Props> = ({ activity }) => {
  const { t } = useI18n();

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
          {activity.slice(0, DASHBOARD_ACTIVITY_LIMIT).map((item) => (
            <ActivityRow
              key={`${item.timestamp}-${item.type ?? ""}-${item.ticketId ?? ""}-${item.projectId ?? ""}`}
              item={item}
            />
          ))}
        </Box>
      )}
    </DashboardCard>
  );
};
