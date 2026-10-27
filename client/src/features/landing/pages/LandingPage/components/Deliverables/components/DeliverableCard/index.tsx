import type React from "react";
import Box from "@mui/material/Box";

interface DeliverableCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export const DeliverableCard: React.FC<DeliverableCardProps> = ({
  title,
  description,
  children,
}) => (
  <Box component="figure" sx={{ m: 0 }}>
    <Box
      sx={{
        background: "var(--tint)",
        borderRadius: "20px",
        p: { xs: "12px", md: "22px" },
        height: { xs: "auto", md: 280 },
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {children}
    </Box>
    <Box component="figcaption">
      <Box
        component="h3"
        sx={{
          m: { xs: "16px 0 4px", md: "22px 0 6px" },
          fontSize: "17px",
          fontWeight: 600,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </Box>
      <Box
        component="p"
        sx={{ m: 0, fontSize: "15px", color: "var(--ink-2)", maxWidth: "36ch" }}
      >
        {description}
      </Box>
    </Box>
  </Box>
);
