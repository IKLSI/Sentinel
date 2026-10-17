import type React from "react";
import Box from "@mui/material/Box";
import { Section } from "@/features/styleGuide/pages/StyleGuidePage/components/Section";
import { SPACING } from "@/features/styleGuide/pages/StyleGuidePage/constants";

export const SpacingSection: React.FC = () => {
  return (
    <Section title="Spacing">
      <Box sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {SPACING.map((s) => (
          <Box
            key={s.label}
            sx={{ display: "flex", alignItems: "center", gap: "16px" }}
          >
            <Box
              sx={{
                width: "24px",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--muted2)",
              }}
            >
              {s.label}
            </Box>
            <Box
              sx={{
                width: `${s.px}px`,
                height: "12px",
                background: "var(--accent-subtle)",
                border: "1px dashed var(--accent-border)",
              }}
            />
            <Box
              sx={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--muted2)",
              }}
            >
              {s.px}px
            </Box>
          </Box>
        ))}
      </Box>
    </Section>
  );
};
