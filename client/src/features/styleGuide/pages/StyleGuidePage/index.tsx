import type React from "react";
import Box from "@mui/material/Box";
import { SentinelWordmark } from "@/components/layout/SentinelWordmark";
import { useT } from "@/contexts/I18nContext";
import { BadgesSection } from "@/features/styleGuide/pages/StyleGuidePage/components/BadgesSection";
import { ButtonsSection } from "@/features/styleGuide/pages/StyleGuidePage/components/ButtonsSection";
import { ColorsSection } from "@/features/styleGuide/pages/StyleGuidePage/components/ColorsSection";
import { FieldsSection } from "@/features/styleGuide/pages/StyleGuidePage/components/FieldsSection";
import { IconsSection } from "@/features/styleGuide/pages/StyleGuidePage/components/IconsSection";
import { OverlaysSection } from "@/features/styleGuide/pages/StyleGuidePage/components/OverlaysSection";
import { RadiusElevationSection } from "@/features/styleGuide/pages/StyleGuidePage/components/RadiusElevationSection";
import { Section } from "@/features/styleGuide/pages/StyleGuidePage/components/Section";
import { StatesSection } from "@/features/styleGuide/pages/StyleGuidePage/components/StatesSection";
import { TablesSection } from "@/features/styleGuide/pages/StyleGuidePage/components/TablesSection";
import { ThemeSwitch } from "@/features/styleGuide/pages/StyleGuidePage/components/ThemeSwitch";
import { TypographySection } from "@/features/styleGuide/pages/StyleGuidePage/components/TypographySection";

const SECTIONS = [
  { id: "colors", key: "colors", Content: ColorsSection },
  { id: "typography", key: "typography", Content: TypographySection },
  {
    id: "radius-elevation",
    key: "radius_elevation",
    Content: RadiusElevationSection,
  },
  { id: "icons", key: "icons", Content: IconsSection },
  { id: "buttons", key: "buttons", Content: ButtonsSection },
  { id: "fields", key: "fields", Content: FieldsSection },
  { id: "badges", key: "badges", Content: BadgesSection },
  { id: "tables", key: "tables", Content: TablesSection },
  { id: "overlays", key: "overlays", Content: OverlaysSection },
  { id: "states", key: "states", Content: StatesSection },
] as const;

const CENTERED_SX = {
  maxWidth: "960px",
  mx: "auto",
  px: { xs: "16px", md: "32px" },
} as const;

export const StyleGuidePage: React.FC = () => {
  const t = useT();

  return (
    <Box
      sx={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}
    >
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          borderBottom: "1px solid var(--border)",
          background: "color-mix(in srgb, var(--bg) 86%, transparent)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Box
          sx={{
            ...CENTERED_SX,
            height: "56px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <SentinelWordmark height={20} />
          <ThemeSwitch />
        </Box>
      </Box>

      <Box
        component="main"
        sx={{ ...CENTERED_SX, pt: { xs: "8px", md: "16px" }, pb: "96px" }}
      >
        {SECTIONS.map(({ id, key, Content }) => (
          <Section
            key={id}
            id={id}
            title={t(`style_guide.section.${key}`)}
            description={t(`style_guide.section.${key}_desc`)}
          >
            <Content />
          </Section>
        ))}
      </Box>
    </Box>
  );
};
