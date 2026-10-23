import type React from "react";
import { useId } from "react";
import Box from "@mui/material/Box";
import { tint } from "@/features/auth/styles";

const RINGS = [
  { r: 80, opacity: 0.3, width: 1.2 },
  { r: 125, opacity: 0.18, width: 1 },
  { r: 175, opacity: 0.11, width: 1 },
];

export const ResetPasswordDecor: React.FC = () => {
  const glowId = useId();

  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 450 600"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              style={{ stopColor: tint("var(--auth-indigo-300)", 20) }}
            />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle cx="450" cy="0" r="160" fill={`url(#${glowId})`} />
        {RINGS.map((ring) => (
          <circle
            key={ring.r}
            cx="450"
            cy="0"
            r={ring.r}
            stroke={`rgba(255,255,255,${ring.opacity})`}
            strokeWidth={ring.width}
          />
        ))}
      </svg>
    </Box>
  );
};
