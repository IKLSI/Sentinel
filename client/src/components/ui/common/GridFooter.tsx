import type React from "react";
import Box from "@mui/material/Box";

interface Props {
  total: number;
  label: string;
  children?: React.ReactNode;
}

export const GridFooter: React.FC<Props> = ({ total, label, children }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      px: "16px",
      py: "10px",
      borderTop: "1px solid var(--border)",
      flexShrink: 0,
      background: "var(--s2)",
    }}
  >
    <Box
      sx={{
        fontSize: "11px",
        color: "var(--muted)",
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.04em",
      }}
    >
      {`${total} ${label}`}
    </Box>
    {children}
  </Box>
);
