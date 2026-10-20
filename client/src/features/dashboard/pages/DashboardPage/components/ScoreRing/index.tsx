import type React from "react";
import Box from "@mui/material/Box";
import {
  PERCENT,
  RING_SIZE,
  RING_THICKNESS,
} from "@/features/dashboard/pages/DashboardPage/constants";

interface Props {
  score: number | null;
  grade: string | null;
  color: string;
}

const CENTER = RING_SIZE / 2;
const RADIUS = (RING_SIZE - RING_THICKNESS) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const ScoreRing: React.FC<Props> = ({ score, grade, color }) => (
  <Box
    sx={{
      position: "relative",
      width: RING_SIZE,
      height: RING_SIZE,
      flexShrink: 0,
    }}
  >
    <svg width={RING_SIZE} height={RING_SIZE} aria-hidden>
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        fill="none"
        stroke="var(--s3)"
        strokeWidth={RING_THICKNESS}
      />
      {score !== null && (
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={RING_THICKNESS}
          strokeLinecap="round"
          strokeDasharray={`${(score / PERCENT) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
        />
      )}
    </svg>
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        fontWeight: 800,
        fontSize: "13px",
        color,
      }}
    >
      {grade ?? "–"}
    </Box>
  </Box>
);
