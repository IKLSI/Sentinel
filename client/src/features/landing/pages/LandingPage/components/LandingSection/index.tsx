import type React from "react";
import Box from "@mui/material/Box";
import {
  LANDING_NAV_OFFSET,
  LANDING_WRAP_SX,
} from "@/features/landing/constants";

interface LandingSectionProps {
  id?: string;
  labelledBy: string;
  tinted?: boolean;
  children: React.ReactNode;
}

export const LandingSection: React.FC<LandingSectionProps> = ({
  id,
  labelledBy,
  tinted = false,
  children,
}) => (
  <Box
    component="section"
    id={id}
    aria-labelledby={labelledBy}
    sx={{
      minHeight: `calc(100svh - ${LANDING_NAV_OFFSET})`,
      scrollMarginTop: LANDING_NAV_OFFSET,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      py: "72px",
      boxSizing: "border-box",
      background: tinted ? "var(--tint)" : "transparent",
    }}
  >
    <Box sx={LANDING_WRAP_SX}>{children}</Box>
  </Box>
);
