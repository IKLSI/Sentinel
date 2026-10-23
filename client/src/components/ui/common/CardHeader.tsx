import type React from "react";
import Box from "@mui/material/Box";

interface Props {
  label: string;
}

export const CardHeader: React.FC<Props> = ({ label }) => (
  <Box
    sx={{
      px: "16px",
      minHeight: "40px",
      display: "flex",
      alignItems: "center",
      borderBottom: "1px solid var(--border)",
      background: "var(--s2)",
    }}
  >
    <Box
      component="h3"
      sx={{
        m: 0,
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--muted)",
      }}
    >
      {label}
    </Box>
  </Box>
);
