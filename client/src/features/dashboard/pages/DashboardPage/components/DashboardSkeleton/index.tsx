import type React from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { keyframes } from "@mui/material/styles";
import { useI18n } from "@/contexts/I18nContext";
import { ChartCardSkeleton } from "@/features/dashboard/pages/DashboardPage/components/ChartCardSkeleton";
import { DashboardCard } from "@/features/dashboard/pages/DashboardPage/components/DashboardCard";

const pulse = keyframes`
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
`;

const TILES = ["critical", "high", "eol", "major"];
const LIST_ROWS = ["first", "second", "third", "fourth"];

const ListCardSkeleton: React.FC<{ title: string }> = ({ title }) => (
  <DashboardCard title={title} scrollable={false}>
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        animation: `${pulse} 1.6s ease-in-out infinite`,
      }}
    >
      {LIST_ROWS.map((row) => (
        <Skeleton
          key={row}
          variant="rounded"
          height={44}
          animation={false}
          sx={{ flexShrink: 0 }}
        />
      ))}
    </Box>
  </DashboardCard>
);

export const DashboardSkeleton: React.FC = () => {
  const { t } = useI18n();

  return (
    <Box
      aria-busy="true"
      sx={{
        height: { xs: "auto", lg: "100vh" },
        minHeight: "100vh",
        overflowY: { xs: "auto", lg: "hidden" },
        boxSizing: "border-box",
        p: "16px 20px",
        display: "grid",
        gridTemplateRows: {
          xs: "auto",
          lg: "auto minmax(0, 1fr) minmax(0, 1fr)",
        },
        gap: "14px",
      }}
    >
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
          animation: `${pulse} 1.6s ease-in-out infinite`,
        }}
      >
        <Skeleton
          variant="circular"
          width={150}
          height={150}
          animation={false}
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
            <Skeleton
              key={tile}
              variant="rounded"
              height={84}
              animation={false}
            />
          ))}
        </Box>
        <Skeleton
          variant="circular"
          width={130}
          height={130}
          animation={false}
          sx={{ mx: "auto" }}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0, 2fr) minmax(0, 1fr)",
          },
          gap: "14px",
          minHeight: 0,
        }}
      >
        <ChartCardSkeleton title={t("dashboard.trend.title")} variant="trend" />
        <ListCardSkeleton title={t("dashboard.tickets.title")} />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "repeat(3, minmax(0, 1fr))",
          },
          gap: "14px",
          minHeight: 0,
        }}
      >
        <ListCardSkeleton title={t("dashboard.projects.title")} />
        <ChartCardSkeleton title={t("dashboard.flow.title")} variant="flow" />
        <ListCardSkeleton title={t("dashboard.activity.title")} />
      </Box>
    </Box>
  );
};
