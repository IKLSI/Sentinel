import type React from "react";
import Box from "@mui/material/Box";

interface FooterColumnProps {
  title: string;
  children: React.ReactNode;
}

export const FooterColumn: React.FC<FooterColumnProps> = ({
  title,
  children,
}) => (
  <Box
    component="nav"
    aria-label={title}
    sx={{
      display: "flex",
      flexDirection: "column",
      gap: "11px",
      fontSize: "14px",
    }}
  >
    <Box
      component="h2"
      sx={{
        m: "4px 0 5px",
        fontSize: "13px",
        fontWeight: 600,
        color: "var(--ink)",
      }}
    >
      {title}
    </Box>
    {children}
  </Box>
);
