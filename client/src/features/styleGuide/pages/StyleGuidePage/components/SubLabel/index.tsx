import type React from "react";
import Box from "@mui/material/Box";

export const SubLabel: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Box
    sx={{
      fontSize: "10px",
      fontWeight: 700,
      letterSpacing: "0.07em",
      textTransform: "uppercase",
      color: "var(--muted2)",
      mb: "12px",
    }}
  >
    {children}
  </Box>
);
