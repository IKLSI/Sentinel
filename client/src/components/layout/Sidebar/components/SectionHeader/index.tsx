import type React from "react";
import Box from "@mui/material/Box";

interface Props {
  label: string;
  mt?: string | number;
}

export const SectionHeader: React.FC<Props> = ({ label, mt }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      px: "4px",
      pt: "8px",
      pb: "4px",
      mt: mt ?? 0,
    }}
  >
    <Box
      component="span"
      sx={{
        fontSize: "9px",
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--muted)",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {label}
    </Box>
    <Box
      sx={{ flex: 1, height: "1px", background: "var(--border)", opacity: 0.8 }}
    />
  </Box>
);
