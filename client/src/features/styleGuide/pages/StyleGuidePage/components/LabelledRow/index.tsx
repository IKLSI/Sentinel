import type React from "react";
import Box from "@mui/material/Box";

interface Props {
  label: string;
  children: React.ReactNode;
}

export const LabelledRow: React.FC<Props> = ({ label, children }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "128px minmax(0, 1fr)" },
      alignItems: "center",
      gap: { xs: "8px", sm: "16px" },
      "& + &": { mt: "20px" },
    }}
  >
    <Box sx={{ fontSize: "12px", color: "var(--muted2)" }}>{label}</Box>
    <Box
      sx={{
        minWidth: 0,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "12px",
      }}
    >
      {children}
    </Box>
  </Box>
);
