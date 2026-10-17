import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import { Section } from "@/features/styleGuide/pages/StyleGuidePage/components/Section";
import { SubLabel } from "@/features/styleGuide/pages/StyleGuidePage/components/SubLabel";
import { Swatch } from "@/features/styleGuide/pages/StyleGuidePage/components/Swatch";
import {
  SEMANTIC_TOKENS,
  SURFACE_TOKENS,
  TEXT_TOKENS,
} from "@/features/styleGuide/pages/StyleGuidePage/constants";

export const ColorsSection: React.FC = () => {
  const t = useT();

  return (
    <Section
      title={t("style_guide.section.colors")}
      desc={t("style_guide.section.colors_desc")}
    >
      <SubLabel>{t("style_guide.color.surfaces")}</SubLabel>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: "14px",
          mb: "28px",
        }}
      >
        {SURFACE_TOKENS.map((token) => (
          <Swatch
            key={token}
            varName={token}
            label={token}
            sub={`--${token}`}
          />
        ))}
      </Box>

      <SubLabel>{t("style_guide.color.text")}</SubLabel>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: "14px",
          mb: "28px",
        }}
      >
        {TEXT_TOKENS.map((token) => (
          <Swatch
            key={token}
            varName={token}
            label={token}
            sub={`--${token}`}
          />
        ))}
      </Box>

      <SubLabel>{t("style_guide.color.accent")}</SubLabel>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: "14px",
        }}
      >
        {SEMANTIC_TOKENS.map(({ name, desc }) => (
          <Swatch key={name} varName={name} label={name} sub={desc} />
        ))}
      </Box>
    </Section>
  );
};
