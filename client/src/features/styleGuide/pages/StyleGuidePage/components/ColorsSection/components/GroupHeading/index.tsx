import type React from "react";
import Box from "@mui/material/Box";

export const GroupHeading: React.FC<{ title: string; hint: string }> = ({
  title,
  hint,
}) => (
  <Box
    sx={{
      mb: "16px",
      display: "flex",
      flexWrap: "wrap",
      alignItems: "baseline",
      columnGap: "10px",
      rowGap: "2px",
    }}
  >
    <Box
      component="h3"
      sx={{ m: 0, fontSize: "14px", fontWeight: 600, color: "var(--text)" }}
    >
      {title}
    </Box>
    <Box sx={{ fontSize: "12.5px", color: "var(--muted2)" }}>{hint}</Box>
  </Box>
);
