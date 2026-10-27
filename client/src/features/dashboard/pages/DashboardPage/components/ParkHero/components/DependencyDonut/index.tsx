import type React from "react";
import Box from "@mui/material/Box";
import { useI18n } from "@/contexts/I18nContext";
import type { ParkOverview } from "@/domains/dashboard/types";
import {
  DEPENDENCY_STATUS_COLORS,
  DONUT_GAP_DEGREES,
  DONUT_SIZE,
  DONUT_THICKNESS,
} from "@/features/dashboard/pages/DashboardPage/constants";

type DependencyStatusKey = keyof typeof DEPENDENCY_STATUS_COLORS;

interface Props {
  dependencies: ParkOverview["dependencies"];
}

const FULL_TURN_DEGREES = 360;
const RADIUS = (DONUT_SIZE - DONUT_THICKNESS) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = DONUT_SIZE / 2;

const STATUS_ORDER: DependencyStatusKey[] = [
  "upToDate",
  "minorUpdate",
  "majorUpdate",
  "endOfLife",
  "vulnerable",
];

export const DependencyDonut: React.FC<Props> = ({ dependencies }) => {
  const { t } = useI18n();
  const segments = STATUS_ORDER.map((key) => ({
    key,
    value: dependencies[key],
  }));
  const visible = segments.filter((segment) => segment.value > 0);
  const gap =
    visible.length > 1
      ? (DONUT_GAP_DEGREES / FULL_TURN_DEGREES) * CIRCUMFERENCE
      : 0;

  let offset = 0;
  const arcs = visible.map((segment) => {
    const length = (segment.value / dependencies.total) * CIRCUMFERENCE;
    const arc = {
      key: segment.key,
      dash: Math.max(length - gap, 0.5),
      offset,
    };
    offset += length;
    return arc;
  });

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "18px" }}>
      <Box sx={{ position: "relative", flexShrink: 0 }}>
        <svg
          width={DONUT_SIZE}
          height={DONUT_SIZE}
          viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
          aria-hidden
        >
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="var(--s2)"
            strokeWidth={DONUT_THICKNESS}
          />
          {arcs.map((arc) => (
            <circle
              key={arc.key}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={DEPENDENCY_STATUS_COLORS[arc.key]}
              strokeWidth={DONUT_THICKNESS}
              strokeDasharray={`${arc.dash} ${CIRCUMFERENCE - arc.dash}`}
              strokeDashoffset={-arc.offset}
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
            />
          ))}
        </svg>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--muted2)",
            fontSize: "11px",
            lineHeight: 1.2,
          }}
        >
          <Box
            component="span"
            sx={{
              fontSize: "22px",
              fontWeight: 800,
              color: "var(--text)",
              letterSpacing: "-0.02em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {dependencies.total}
          </Box>
          {t("dashboard.hero.dependencies")}
        </Box>
      </Box>
      <Box
        component="ul"
        sx={{
          listStyle: "none",
          m: 0,
          p: 0,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          fontSize: "12px",
          color: "var(--muted2)",
          minWidth: 0,
        }}
      >
        {segments.map((segment) => (
          <Box
            component="li"
            key={segment.key}
            sx={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Box
              component="span"
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                flexShrink: 0,
                background: DEPENDENCY_STATUS_COLORS[segment.key],
              }}
            />
            {t(`dashboard.dependency_status.${segment.key}`)}
            <Box
              component="span"
              sx={{
                ml: "auto",
                pl: "12px",
                color: "var(--text)",
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {segment.value}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
