import type React from "react";
import { useLocation } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import {
  contentEnter,
  EASE_OUT_EXPO,
  REDUCED_MOTION,
} from "@/styles/keyframes";

const TRANSITION_SX = {
  "& > *:nth-of-type(n + 2)": {
    animation: `${contentEnter} 0.5s ${EASE_OUT_EXPO} 0.04s both`,
    willChange: "opacity, transform",
  },
  [REDUCED_MOTION]: {
    "& > *": { animation: "none" },
  },
} as const;

export const PageTransition: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathname = useLocation({ select: (location) => location.pathname });
  return (
    <Box key={pathname} sx={TRANSITION_SX}>
      {children}
    </Box>
  );
};
