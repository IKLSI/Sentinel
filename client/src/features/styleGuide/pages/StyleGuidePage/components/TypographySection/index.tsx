import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import { Specimen } from "@/features/styleGuide/pages/StyleGuidePage/components/Specimen";
import { FontFamilyCard } from "@/features/styleGuide/pages/StyleGuidePage/components/TypographySection/components/FontFamilyCard";
import { TypeScaleRow } from "@/features/styleGuide/pages/StyleGuidePage/components/TypographySection/components/TypeScaleRow";
import { VariantRow } from "@/features/styleGuide/pages/StyleGuidePage/components/TypographySection/components/VariantRow";
import {
  FONT_FAMILIES,
  THEME_VARIANTS,
  TYPE_SCALE,
} from "@/features/styleGuide/pages/StyleGuidePage/components/TypographySection/constants";

const LIST_CANVAS_SX = {
  p: { xs: "4px 16px", md: "4px 20px" },
  backgroundColor: "var(--s1)",
  backgroundImage: "none",
} as const;

export const TypographySection: React.FC = () => {
  const t = useT();

  return (
    <>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "repeat(2, minmax(0, 1fr))",
          },
          gap: "16px",
        }}
      >
        {FONT_FAMILIES.map(({ token, name, usageKey }) => (
          <FontFamilyCard
            key={token}
            token={token}
            name={name}
            usage={t(usageKey)}
          />
        ))}
      </Box>

      <Specimen
        title={t("style_guide.typography.scale")}
        note={t("style_guide.typography.scale_note")}
        canvasSx={LIST_CANVAS_SX}
      >
        {TYPE_SCALE.map((step) => (
          <TypeScaleRow key={step.size} step={step} />
        ))}
      </Specimen>

      <Specimen
        title={t("style_guide.typography.variants")}
        source="configs/themes/typography.ts"
        canvasSx={LIST_CANVAS_SX}
      >
        {THEME_VARIANTS.map(({ name, exampleKey }) => (
          <VariantRow key={name} name={name} example={t(exampleKey)} />
        ))}
      </Specimen>
    </>
  );
};
