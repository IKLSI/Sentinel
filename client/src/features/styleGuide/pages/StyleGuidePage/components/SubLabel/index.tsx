import type React from "react";
import Box from "@mui/material/Box";

export const SubLabel: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Box
    sx={{
      typography: "label",
      color: "var(--muted2)",
      mb: "12px",
    }}
  >
    {children}
  </Box>
);
