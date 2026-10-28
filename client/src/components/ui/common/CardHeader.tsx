import type React from "react";
import Box from "@mui/material/Box";

interface Props {
  label: string;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<Props> = ({ label, action }) => (
  <Box
    sx={{
      px: "16px",
      minHeight: "40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      borderBottom: "1px solid var(--border)",
      background: "var(--s2)",
    }}
  >
    <Box
      component="h3"
      sx={{
        m: 0,
        typography: "cardTitle",
        color: "var(--muted)",
      }}
    >
      {label}
    </Box>
    {action}
  </Box>
);
