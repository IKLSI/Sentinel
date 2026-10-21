import type React from "react";
import Box from "@mui/material/Box";

interface SectionIntroProps {
  titleId: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  spacing?: string;
}

export const SectionIntro: React.FC<SectionIntroProps> = ({
  titleId,
  title,
  description,
  spacing = "56px",
}) => (
  <Box sx={{ maxWidth: 880, mx: "auto", mb: spacing, textAlign: "center" }}>
    <Box
      component="h2"
      id={titleId}
      sx={{
        m: 0,
        mb: description ? "18px" : 0,
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: "clamp(32px, 4.4vw, 52px)",
        lineHeight: 1.04,
        letterSpacing: "-0.04em",
        textWrap: "balance",
        color: "var(--ink)",
      }}
    >
      {title}
    </Box>
    {description && (
      <Box
        component="p"
        sx={{
          m: 0,
          mx: "auto",
          maxWidth: 720,
          fontSize: "18px",
          color: "var(--ink-2)",
          textWrap: "pretty",
        }}
      >
        {description}
      </Box>
    )}
  </Box>
);
