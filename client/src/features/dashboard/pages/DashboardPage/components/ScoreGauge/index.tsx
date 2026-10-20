import type React from "react";
import Box from "@mui/material/Box";
import {
  GAUGE_BAND_GAP,
  GAUGE_BANDS,
  GAUGE_SIZE,
  GAUGE_THICKNESS,
} from "@/features/dashboard/pages/DashboardPage/constants";
import {
  arcPath,
  arcPoint,
} from "@/features/dashboard/pages/DashboardPage/helpers";

interface Props {
  score: number | null;
  label: string;
}

const CENTER = GAUGE_SIZE / 2;
const RADIUS = (GAUGE_SIZE - GAUGE_THICKNESS) / 2;
const MARKER_RADIUS = GAUGE_THICKNESS / 2 + 3;

export const ScoreGauge: React.FC<Props> = ({ score, label }) => {
  const marker =
    score === null ? null : arcPoint(CENTER, CENTER, RADIUS, score);

  return (
    <Box sx={{ position: "relative", width: GAUGE_SIZE, maxWidth: "100%" }}>
      <svg
        viewBox={`0 0 ${GAUGE_SIZE} ${CENTER + GAUGE_THICKNESS}`}
        width="100%"
        role="img"
        aria-label={label}
      >
        {GAUGE_BANDS.map((band) => (
          <path
            key={band.from}
            d={arcPath(
              CENTER,
              CENTER,
              RADIUS,
              band.from + GAUGE_BAND_GAP,
              band.to - GAUGE_BAND_GAP,
            )}
            fill="none"
            stroke={band.color}
            strokeWidth={GAUGE_THICKNESS}
            opacity={score === null ? 0.25 : 1}
          />
        ))}
        {marker && (
          <circle
            cx={marker.x}
            cy={marker.y}
            r={MARKER_RADIUS}
            fill="var(--text)"
            stroke="var(--s1)"
            strokeWidth={4}
          />
        )}
      </svg>
      <Box
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: "6px",
          textAlign: "center",
          fontSize: "48px",
          fontWeight: 800,
          letterSpacing: "-0.045em",
          lineHeight: 1,
          color: "var(--text)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {score ?? "–"}
      </Box>
    </Box>
  );
};
