import type React from "react";
import Box from "@mui/material/Box";

export const Section: React.FC<{
  title: string;
  desc?: string;
  children: React.ReactNode;
}> = ({ title, desc, children }) => (
  <Box
    component="section"
    sx={{
      py: "40px",
      borderTop: "1px solid var(--border)",
      "&:first-of-type": { borderTop: "none", pt: 0 },
    }}
  >
    <Box
      sx={{
        fontSize: "20px",
        fontWeight: 700,
        letterSpacing: "-0.01em",
        mb: desc ? "6px" : "20px",
      }}
    >
      {title}
    </Box>
    {desc && (
      <Box
        sx={{ fontSize: "13px", color: "var(--text-secondary)", mb: "24px" }}
      >
        {desc}
      </Box>
    )}
    {children}
  </Box>
);
