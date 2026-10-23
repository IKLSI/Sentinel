import type React from "react";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { EASE_OUT_EXPO, pageItemIn, REDUCED_MOTION } from "@/styles/keyframes";

const STAGGER_STEP = 0.07;
const STAGGERED_CHILDREN = 5;

const staggerDelays = Object.fromEntries(
  Array.from({ length: STAGGERED_CHILDREN }, (_, index) => [
    `& > *:nth-of-type(${index + 1})`,
    { animationDelay: `${index * STAGGER_STEP}s` },
  ]),
);

const DEFAULT_SX = {
  p: "20px 28px",
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  "& > *": {
    animation: `${pageItemIn} 0.5s ${EASE_OUT_EXPO} both`,
    animationDelay: `${STAGGERED_CHILDREN * STAGGER_STEP}s`,
    willChange: "opacity, transform",
  },
  ...staggerDelays,
  [REDUCED_MOTION]: {
    "& > *": { animation: "none" },
  },
} as const;

interface Props {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

export const PageContainer: React.FC<Props> = ({ children, sx }) => (
  <Box sx={{ ...DEFAULT_SX, ...sx }}>{children}</Box>
);
