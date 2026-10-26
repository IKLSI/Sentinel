import type React from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { DELAYED_REVEAL_SX } from "@/styles/keyframes";

interface Props {
  label: string;
}

export const LoadingStatus: React.FC<Props> = ({ label }) => (
  <Box
    sx={{
      position: "absolute",
      inset: 0,
      zIndex: 2,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      p: "24px",
      borderRadius: "inherit",
      background: "color-mix(in srgb, var(--bg) 60%, transparent)",
      backdropFilter: "blur(2px)",
      ...DELAYED_REVEAL_SX,
    }}
  >
    <Box
      role="status"
      aria-live="polite"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "14px",
        textAlign: "center",
        color: "var(--muted2)",
      }}
    >
      <CircularProgress size={28} thickness={4} color="inherit" />
      <Box
        component="span"
        sx={{
          fontSize: "14px",
          fontWeight: 600,
          letterSpacing: "0.01em",
          lineHeight: 1.4,
          color: "var(--text-secondary)",
        }}
      >
        {label}
      </Box>
    </Box>
  </Box>
);
