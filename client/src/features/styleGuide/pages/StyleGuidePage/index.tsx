import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import { TypographySection } from "@/features/styleGuide/pages/StyleGuidePage/components/TypographySection";
import { ColorsSection } from "@/features/styleGuide/pages/StyleGuidePage/components/ColorsSection";
import { ButtonsSection } from "@/features/styleGuide/pages/StyleGuidePage/components/ButtonsSection";
import { InputsSection } from "@/features/styleGuide/pages/StyleGuidePage/components/InputsSection";
import { ChipsSection } from "@/features/styleGuide/pages/StyleGuidePage/components/ChipsSection";
import { CardsSection } from "@/features/styleGuide/pages/StyleGuidePage/components/CardsSection";
import { AvatarsSection } from "@/features/styleGuide/pages/StyleGuidePage/components/AvatarsSection";
import { SwitchSection } from "@/features/styleGuide/pages/StyleGuidePage/components/SwitchSection";
import { ModalsSection } from "@/features/styleGuide/pages/StyleGuidePage/components/ModalsSection";
import { IconsSection } from "@/features/styleGuide/pages/StyleGuidePage/components/IconsSection";
import { TooltipsSection } from "@/features/styleGuide/pages/StyleGuidePage/components/TooltipsSection";
import { RowActionsSection } from "@/features/styleGuide/pages/StyleGuidePage/components/RowActionsSection";
import { RadiusSection } from "@/features/styleGuide/pages/StyleGuidePage/components/RadiusSection";
import { SpacingSection } from "@/features/styleGuide/pages/StyleGuidePage/components/SpacingSection";

export const StyleGuidePage: React.FC = () => {
  const t = useT();

  return (
    <Box sx={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Box sx={{ maxWidth: "980px", mx: "auto", px: "32px", py: "56px" }}>
        <Box
          sx={{
            mb: "8px",
            fontSize: "32px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          {t("style_guide.title")}
        </Box>
        <Box
          sx={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
          }}
        >
          {t("style_guide.subtitle")}
        </Box>

        <Box sx={{ height: "48px" }} />

        <TypographySection />
        <ColorsSection />
        <ButtonsSection />
        <InputsSection />
        <ChipsSection />
        <CardsSection />
        <AvatarsSection />
        <SwitchSection />
        <ModalsSection />
        <TooltipsSection />
        <RowActionsSection />
        <IconsSection />
        <RadiusSection />
        <SpacingSection />
      </Box>
    </Box>
  );
};
