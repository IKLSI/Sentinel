import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import {
  FAQ_ITEM_IDS,
  LANDING_SECTION_IDS,
} from "@/features/landing/constants";
import { FaqItem } from "@/features/landing/pages/LandingPage/components/Faq/components/FaqItem";
import { LandingSection } from "@/features/landing/pages/LandingPage/components/LandingSection";
import { SectionIntro } from "@/features/landing/pages/LandingPage/components/SectionIntro";

const TITLE_ID = "landing-faq-title";

export const Faq: React.FC = () => {
  const t = useT();

  return (
    <LandingSection id={LANDING_SECTION_IDS.faq} labelledBy={TITLE_ID}>
      <SectionIntro
        titleId={TITLE_ID}
        title={t("landing.faq.title")}
        spacing="40px"
      />
      <Box
        sx={{
          maxWidth: 800,
          width: "100%",
          mx: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {FAQ_ITEM_IDS.map((id) => (
          <FaqItem
            key={id}
            question={t(`landing.faq.${id}.question`)}
            answer={t(`landing.faq.${id}.answer`)}
          />
        ))}
      </Box>
    </LandingSection>
  );
};
