import type React from "react";
import Box from "@mui/material/Box";

interface GdprRowProps {
  label: string;
  labelColor: string;
  help: string;
  bordered?: boolean;
  children: React.ReactNode;
}

export const GdprRow: React.FC<GdprRowProps> = ({
  label,
  labelColor,
  help,
  bordered = false,
  children,
}) => (
  <Box
    sx={{
      px: "16px",
      py: "11px",
      display: "flex",
      alignItems: "center",
      gap: "14px",
      borderBottom: bordered ? "1px solid var(--border)" : undefined,
    }}
  >
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Box
        sx={{
          fontSize: "12px",
          fontWeight: 600,
          color: labelColor,
          mb: "2px",
        }}
      >
        {label}
      </Box>
      <Box sx={{ fontSize: "11px", color: "var(--muted)" }}>{help}</Box>
    </Box>
    {children}
  </Box>
);
