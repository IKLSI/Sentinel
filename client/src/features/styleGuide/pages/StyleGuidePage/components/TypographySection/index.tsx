import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import { Section } from "@/features/styleGuide/pages/StyleGuidePage/components/Section";
import {
  LABEL_VARIANTS,
  TYPE_SCALE,
  WEIGHTS,
} from "@/features/styleGuide/pages/StyleGuidePage/constants";

export const TypographySection: React.FC = () => {
  const t = useT();

  return (
    <Section title={t("style_guide.section.typography")}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          mb: "28px",
        }}
      >
        {TYPE_SCALE.map((s) => (
          <Box
            key={s.key}
            sx={{ display: "flex", alignItems: "baseline", gap: "16px" }}
          >
            <Box
              sx={{
                width: "110px",
                flexShrink: 0,
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--muted2)",
              }}
            >
              {s.key} — {s.rem}
            </Box>
            <Box
              sx={{
                fontSize: s.rem,
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              Sentinel
            </Box>
          </Box>
        ))}
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          mb: "28px",
        }}
      >
        {LABEL_VARIANTS.map((variant) => (
          <Box
            key={variant}
            sx={{ display: "flex", alignItems: "baseline", gap: "16px" }}
          >
            <Box
              sx={{
                width: "110px",
                flexShrink: 0,
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--muted2)",
              }}
            >
              {variant}
            </Box>
            <Box sx={{ typography: variant, color: "var(--muted)" }}>
              Open tickets
            </Box>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {WEIGHTS.map((w) => (
          <Box key={w.label} sx={{ fontSize: "14px", fontWeight: w.weight }}>
            {w.label} — The quick brown fox jumps over the lazy dog
          </Box>
        ))}
      </Box>
    </Section>
  );
};
