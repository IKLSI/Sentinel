import type React from "react";
import Box from "@mui/material/Box";
import {
  GAUGE_CIRCUMFERENCE,
  GAUGE_MAX_SCORE,
  GAUGE_RADIUS,
  GAUGE_SIZE,
  GAUGE_STROKE,
} from "./constants";

interface Props {
  score: number;
  color: string;
}

export const HealthGauge: React.FC<Props> = ({ score, color }) => {
  const clamped = Math.max(0, Math.min(GAUGE_MAX_SCORE, score));
  const filled = (clamped / GAUGE_MAX_SCORE) * GAUGE_CIRCUMFERENCE;
  const center = GAUGE_SIZE / 2;

  return (
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
            fontSize: "15px",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: "var(--text)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {Math.round(clamped)}
        </Box>
      </Box>
    </Box>
  );
};
