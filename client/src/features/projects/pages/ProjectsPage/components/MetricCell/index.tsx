import type React from "react";
import Box from "@mui/material/Box";

interface Props {
  value: React.ReactNode;
  emphasized: boolean;
  accent: string | undefined;
}

export const MetricCell: React.FC<Props> = ({ value, emphasized, accent }) => (
  <Box
    component="td"
    sx={{
      padding: "6px 12px",
      borderBottom: "1px solid var(--border)",
      textAlign: "center",
    }}
  >
    <Box
      sx={{
        color: emphasized ? accent : "var(--muted2)",
        fontWeight: emphasized ? 700 : 500,
        fontSize: "13px",
        lineHeight: 1.25,
        fontFamily: "var(--font-mono)",
      }}
    >
      {value}
    </Box>
  </Box>
);
