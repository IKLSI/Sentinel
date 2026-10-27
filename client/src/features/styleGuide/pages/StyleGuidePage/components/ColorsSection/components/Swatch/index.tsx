import type React from "react";
import Box from "@mui/material/Box";

export const Swatch: React.FC<{
  varName: string;
  label: string;
  sub: string;
}> = ({ varName, label, sub }) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    <Box
      sx={{
        height: "56px",
        borderRadius: "var(--r-md)",
        background: `var(--${varName})`,
        border: "1px solid var(--border)",
      }}
    />
    <Box>
      <Box sx={{ fontSize: "12px", fontWeight: 600 }}>{label}</Box>
      <Box
        sx={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "var(--muted2)",
        }}
      >
        {sub}
      </Box>
    </Box>
  </Box>
);
