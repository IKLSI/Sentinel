import type React from "react";
import { useMemo } from "react";
import Box from "@mui/material/Box";
import ShowChartOutlined from "@mui/icons-material/ShowChartOutlined";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/ui/common/EmptyState";
import { useI18n } from "@/contexts/I18nContext";
import type { ScorePoint } from "@/domains/dashboard/types";
import { ChartTooltip } from "@/features/dashboard/pages/DashboardPage/components/ChartTooltip";
import { DashboardCard } from "@/features/dashboard/pages/DashboardPage/components/DashboardCard";
import {
  CHART_GRADIENT_ID,
  SCORE_AXIS_PADDING,
  CHART_MIN_HEIGHT,
  SCORE_MAX,
  SCORE_MIN,
} from "@/features/dashboard/pages/DashboardPage/constants";
import { formatDayLabel } from "@/features/dashboard/pages/DashboardPage/helpers";

interface Props {
  history: ScorePoint[];
}

const CHART_MARGIN = { top: 8, right: 8, bottom: 0, left: 0 };
const Y_AXIS_WIDTH = 30;
const AXIS_TICK = { fontSize: 10.5, fill: "var(--muted)" };

const MINIMUM_POINTS = 1;
const SINGLE_POINT_DOT = {
  r: 5,
  fill: "var(--accent)",
  stroke: "var(--s1)",
  strokeWidth: 2,
};

export const ScoreTrendCard: React.FC<Props> = ({ history }) => {
  const { t, culture } = useI18n();

  const { data, known } = useMemo(() => {
    const data = history.map((point) => ({
      label: formatDayLabel(point.date, culture),
      score: point.score ?? null,
    }));
    const known = history
      .map((point) => point.score)
      .filter(
        (score): score is number => score !== null && score !== undefined,
      );
    return { data, known };
  }, [history, culture]);

  const domain: [number, number] = known.length
    ? [
        Math.max(SCORE_MIN, Math.min(...known) - SCORE_AXIS_PADDING),
        Math.min(SCORE_MAX, Math.max(...known) + SCORE_AXIS_PADDING),
      ]
    : [SCORE_MIN, SCORE_MAX];

  const summary = [
    { key: "start", value: known[0] },
    { key: "best", value: known.length ? Math.max(...known) : undefined },
    { key: "today", value: known[known.length - 1] },
  ];

  return (
    <DashboardCard
      title={t("dashboard.trend.title")}
      action={
        known.length > 0 && (
          <Box sx={{ display: "flex", gap: "22px" }}>
            {summary.map((item) => (
              <Box
                key={item.key}
                sx={{ fontSize: "12px", color: "var(--muted2)" }}
              >
                {t(`dashboard.trend.${item.key}`)}{" "}
                <Box
                  component="b"
                  sx={{
                    fontSize: "18px",
                    color: "var(--text)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {item.value ?? "–"}
                </Box>
              </Box>
            ))}
          </Box>
        )
      }
    >
      {known.length < MINIMUM_POINTS ? (
        <EmptyState
          icon={ShowChartOutlined}
          title={t("dashboard.trend.empty_title")}
          subtitle={t("dashboard.trend.empty_subtitle")}
          sx={{ flex: 1 }}
        />
      ) : (
        <Box
          sx={{ flex: 1, minHeight: CHART_MIN_HEIGHT, position: "relative" }}
        >
          <Box sx={{ position: "absolute", inset: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={CHART_MARGIN}>
                <defs>
                  <linearGradient
                    id={CHART_GRADIENT_ID}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--accent)"
                      stopOpacity={0.22}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--accent)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="3 4"
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={40}
                  tick={AXIS_TICK}
                  tickMargin={8}
                />
                <YAxis
                  width={Y_AXIS_WIDTH}
                  domain={domain}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  tick={AXIS_TICK}
                />
                <Tooltip
                  content={
                    <ChartTooltip
                      labels={{ score: t("dashboard.trend.tooltip_label") }}
                    />
                  }
                  cursor={{ stroke: "var(--border2)" }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  connectNulls
                  stroke="var(--accent)"
                  strokeWidth={2.2}
                  fill={`url(#${CHART_GRADIENT_ID})`}
                  dot={
                    known.length === MINIMUM_POINTS ? SINGLE_POINT_DOT : false
                  }
                  activeDot={{
                    r: 4,
                    fill: "var(--accent)",
                    stroke: "var(--s1)",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}
    </DashboardCard>
  );
};
