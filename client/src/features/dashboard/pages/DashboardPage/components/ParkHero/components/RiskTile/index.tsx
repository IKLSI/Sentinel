import type React from "react";
import Box from "@mui/material/Box";

interface Props {
  value: number;
  label: string;
  hint: string;
  color: string;
}

export const RiskTile: React.FC<Props> = ({ value, label, hint, color }) => (
  <Box
    sx={{
      borderRadius: "var(--r-md)",
      p: "10px 14px",
      background: "var(--s2)",
      border: "1px solid var(--border)",
      minWidth: 0,
    }}
  >
    <Box
      sx={{
        fontSize: "24px",
        fontWeight: 800,
        letterSpacing: "-0.03em",
        lineHeight: 1.05,
        color: value > 0 ? color : "var(--muted2)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </Box>
    <Box sx={{ fontSize: "12.5px", color: "var(--text)", mt: "2px" }}>
      {label}
    </Box>
    <Box sx={{ fontSize: "11.5px", color: "var(--muted)", mt: "3px" }}>
      {hint}
    </Box>
  </Box>
);
