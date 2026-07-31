import type React from "react";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import {
  GAUGE_CIRCUMFERENCE,
  GAUGE_MAX_SCORE,
  GAUGE_RADIUS,
  GAUGE_SIZE,
  GAUGE_STROKE,
} from "@/features/dashboard/pages/DashboardPage/components/HealthGauge/constants";
import { scoreToGrade } from "@/features/dashboard/pages/DashboardPage/helpers";

interface Props {
  score: number;
  color: string;
}

export const HealthGauge: React.FC<Props> = ({ score, color }) => {
  const clamped = Math.max(0, Math.min(GAUGE_MAX_SCORE, score));
  const filled = (clamped / GAUGE_MAX_SCORE) * GAUGE_CIRCUMFERENCE;
  const center = GAUGE_SIZE / 2;
  const grade = scoreToGrade(clamped);

  return (
    <Tooltip title={`Score moyen : ${Math.round(clamped)} / 100`} arrow>
    <Box
      sx={{
        position: "relative",
        width: GAUGE_SIZE,
        height: GAUGE_SIZE,
        flexShrink: 0,
      }}
    >
      <svg
        width={GAUGE_SIZE}
        height={GAUGE_SIZE}
        viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        <circle
          cx={center}
          cy={center}
          r={GAUGE_RADIUS}
          fill="none"
          stroke="var(--s3)"
          strokeWidth={GAUGE_STROKE}
        />
        <circle
          cx={center}
          cy={center}
          r={GAUGE_RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={GAUGE_STROKE}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${GAUGE_CIRCUMFERENCE}`}
          style={{ transition: "stroke-dasharray 0.6s ease, stroke 0.3s ease" }}
        />
      </svg>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            fontFamily: "var(--font-mono)",
            fontSize: "17px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            color,
          }}
        >
          {grade}
        </Box>
      </Box>
    </Box>
    </Tooltip>
  );
};
