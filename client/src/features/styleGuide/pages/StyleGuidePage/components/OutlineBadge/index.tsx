import type React from "react";
import Box from "@mui/material/Box";

export const OutlineBadge: React.FC<{
  children: React.ReactNode;
  color?: string;
  bg?: string;
  border?: string;
}> = ({
  children,
  color = "var(--text-secondary)",
  bg = "transparent",
  border = "var(--border2)",
}) => (
  <Box
    sx={{
      display: "inline-flex",
      alignItems: "center",
      height: "24px",
      px: "10px",
      borderRadius: "var(--r-sm)",
      fontSize: "12px",
      fontWeight: 600,
      color,
      background: bg,
      border: `1px solid ${border}`,
    }}
  >
    {children}
  </Box>
);
