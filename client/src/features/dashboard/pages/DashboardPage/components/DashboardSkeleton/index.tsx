import type React from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { LoadingStatus } from "@/components/ui/common/feedback/LoadingStatus";
import { ListSkeleton } from "@/components/ui/common/feedback/ListSkeleton";
import { useI18n } from "@/contexts/I18nContext";
import { ChartCardSkeleton } from "@/features/dashboard/pages/DashboardPage/components/ChartCardSkeleton";
import { DashboardCard } from "@/features/dashboard/pages/DashboardPage/components/DashboardCard";
import { DELAYED_REVEAL_SX } from "@/styles/keyframes";
import {
  DASHBOARD_BOTTOM_ROW_SX,
  DASHBOARD_LAYOUT_SX,
  DASHBOARD_TOP_ROW_SX,
} from "@/features/dashboard/pages/DashboardPage/constants";

const TILES = ["critical", "high", "eol", "major"];

const ListCardSkeleton: React.FC<{ title: string }> = ({ title }) => (
  <DashboardCard title={title} scrollable={false}>
    <ListSkeleton rows={4} rowHeight={48} />
  </DashboardCard>
);

export const DashboardSkeleton: React.FC = () => {
  const { t } = useI18n();

  return (
    <Box
      aria-busy="true"
      sx={{
        position: "relative",
        ...DASHBOARD_LAYOUT_SX,
        ...DELAYED_REVEAL_SX,
      }}
    >
      <LoadingStatus label={t("dashboard.loading")} />
      <Box
        sx={{
          borderRadius: "var(--r-lg)",
          background: "var(--s1)",
          border: "1px solid var(--border)",
          boxShadow: "var(--sh-1)",
          p: { xs: "18px", md: "16px 26px" },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "220px minmax(0, 1fr) 270px" },
          gap: { xs: "18px", lg: "28px" },
          alignItems: "center",
        }}
      >
        <Skeleton
          variant="circular"
          width={150}
          height={150}
          sx={{ mx: "auto" }}
        />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
            },
            gap: "12px",
          }}
        >
          {TILES.map((tile) => (
            <Skeleton key={tile} variant="rounded" height={84} />
          ))}
        </Box>
        <Skeleton
          variant="circular"
          width={130}
          height={130}
          sx={{ mx: "auto" }}
        />
      </Box>

      <Box sx={DASHBOARD_TOP_ROW_SX}>
        <ChartCardSkeleton title={t("dashboard.trend.title")} variant="trend" />
        <ListCardSkeleton title={t("dashboard.tickets.title")} />
      </Box>

      <Box sx={DASHBOARD_BOTTOM_ROW_SX}>
        <ListCardSkeleton title={t("dashboard.projects.title")} />
        <ChartCardSkeleton title={t("dashboard.flow.title")} variant="flow" />
        <ListCardSkeleton title={t("dashboard.activity.title")} />
      </Box>
    </Box>
  );
};
