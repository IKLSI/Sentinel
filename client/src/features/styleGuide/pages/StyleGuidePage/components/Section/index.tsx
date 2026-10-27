import type React from "react";
import Box from "@mui/material/Box";

interface Props {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

export const Section: React.FC<Props> = ({
  id,
  title,
  description,
  children,
}) => (
  <Box
    component="section"
    id={id}
    aria-labelledby={`${id}-title`}
    sx={{
      py: "36px",
      borderTop: "1px solid var(--border)",
      "&:first-of-type": { borderTop: "none" },
    }}
  >
    <Box
      component="h2"
      id={`${id}-title`}
      sx={{
        m: 0,
        fontSize: "22px",
        fontWeight: 650,
        lineHeight: 1.25,
        letterSpacing: "-0.02em",
        color: "var(--text)",
      }}
    >
      {title}
    </Box>
    <Box
      component="p"
      sx={{
        mt: "8px",
        mb: 0,
        fontSize: "14px",
        lineHeight: 1.6,
        color: "var(--text-secondary)",
      }}
    >
      {description}
    </Box>
    <Box
      sx={{
        mt: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {children}
    </Box>
  </Box>
);
