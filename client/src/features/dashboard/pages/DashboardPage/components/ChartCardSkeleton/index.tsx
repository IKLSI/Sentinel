import type React from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { DashboardCard } from "@/features/dashboard/pages/DashboardPage/components/DashboardCard";
import { RESPONSIVE_CHART_MIN_HEIGHT } from "@/features/dashboard/pages/DashboardPage/constants";
import { skeletonPulse } from "@/styles/keyframes";

interface Props {
  title: string;
  variant: "trend" | "flow";
}

const GRID_LINES = ["top", "upper", "lower", "bottom"];

const TREND_PATH =
  "M0,70 C40,64 70,52 110,56 C150,60 180,30 230,34 C270,37 300,18 340,14";

const FLOW_BARS = [
  28, 44, 18, 60, 36, 22, 52, 30, 68, 40, 24, 56, 34, 46, 20,
].map((height, position) => ({ id: `bar-${position}`, height }));

const AXIS_LABELS = ["first", "second", "third", "last"];

const HEADER_PLACEHOLDERS = {
  trend: [],
  flow: ["detected", "resolved"],
} as const;

const shimmerSx = {
  animation: `${skeletonPulse} 1.6s ease-in-out infinite`,
} as const;

export const ChartCardSkeleton: React.FC<Props> = ({ title, variant }) => (
  <DashboardCard
    title={title}
    scrollable={false}
    action={
      <Box sx={{ display: "flex", gap: "16px" }}>
        {HEADER_PLACEHOLDERS[variant].map((key) => (
          <Skeleton key={key} variant="rounded" width={64} height={14} />
        ))}
      </Box>
    }
  >
    <Box
      sx={{
        flex: 1,
        minHeight: RESPONSIVE_CHART_MIN_HEIGHT,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <Box sx={{ position: "relative", flex: 1, ...shimmerSx }}>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {GRID_LINES.map((line) => (
            <Box
              key={line}
              sx={{ borderTop: "1px dashed var(--border)", width: "100%" }}
            />
          ))}
        </Box>
        {variant === "trend" ? (
          <Box
            component="svg"
            viewBox="0 0 340 90"
            preserveAspectRatio="none"
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
          >
            <defs>
              <linearGradient id="skeleton-trend" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--accent)"
                  stopOpacity={0.18}
                />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <path
              d={`${TREND_PATH} L340,90 L0,90 Z`}
              fill="url(#skeleton-trend)"
            />
            <path
              d={TREND_PATH}
              fill="none"
              stroke="var(--border2)"
              strokeWidth={2}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </Box>
        ) : (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: "6px",
              px: "4px",
            }}
          >
            {FLOW_BARS.map(({ id, height }) => (
              <Box
                key={id}
                sx={{
                  flex: 1,
                  height: `${height}%`,
                  borderRadius: "3px 3px 0 0",
                  background: "var(--s3)",
                }}
              />
            ))}
          </Box>
        )}
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        {AXIS_LABELS.map((label) => (
          <Skeleton key={label} variant="rounded" width={36} height={10} />
        ))}
      </Box>
    </Box>
  </DashboardCard>
);
