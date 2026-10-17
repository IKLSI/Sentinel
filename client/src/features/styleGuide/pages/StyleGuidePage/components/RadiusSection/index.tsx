import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import { Section } from "@/features/styleGuide/pages/StyleGuidePage/components/Section";
import { RADII } from "@/features/styleGuide/pages/StyleGuidePage/constants";

export const RadiusSection: React.FC = () => {
  const t = useT();

  return (
    <Section
      title={t("style_guide.section.radius")}
      desc={t("style_guide.section.radius_desc")}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
          gap: "14px",
        }}
      >
        {RADII.map((r) => (
          <Box
            key={r.key}
            sx={{ display: "flex", flexDirection: "column", gap: "8px" }}
          >
            <Box
              sx={{
                width: "100%",
                height: "64px",
                background: "var(--s2)",
                border: "1px solid var(--border2)",
                borderRadius: `var(--${r.key})`,
              }}
            />
            <Box
              sx={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "var(--muted2)",
              }}
            >
              {r.label}
            </Box>
          </Box>
        ))}
      </Box>
    </Section>
  );
};
