import type React from "react";
import Box from "@mui/material/Box";
import { useI18n } from "@/contexts/I18nContext";
import { DeliverableAlertPreview } from "@/features/landing/pages/LandingPage/components/Deliverables/components/DeliverableAlertPreview";
import { DeliverableCard } from "@/features/landing/pages/LandingPage/components/Deliverables/components/DeliverableCard";
import { DeliverableReportPreview } from "@/features/landing/pages/LandingPage/components/Deliverables/components/DeliverableReportPreview";
import { DeliverableSbomPreview } from "@/features/landing/pages/LandingPage/components/Deliverables/components/DeliverableSbomPreview";
import { DeliverableTicketPreview } from "@/features/landing/pages/LandingPage/components/Deliverables/components/DeliverableTicketPreview";
import { LandingSection } from "@/features/landing/pages/LandingPage/components/LandingSection";
import { SectionIntro } from "@/features/landing/pages/LandingPage/components/SectionIntro";

const TITLE_ID = "landing-deliverables-title";

export const Deliverables: React.FC = () => {
  const { t } = useI18n();

  return (
    <LandingSection labelledBy={TITLE_ID}>
      <SectionIntro
        titleId={TITLE_ID}
        title={t("landing.deliverables.title")}
        description={t("landing.deliverables.subtitle")}
      />
      <Box
        sx={{
          display: "grid",
          gap: "28px",
          gridTemplateColumns: "1fr",
          "@media (min-width:860px)": {
            gridTemplateColumns: "repeat(3, 1fr)",
          },
        }}
      >
        <DeliverableCard
          title={t("landing.deliverables.alert.title")}
          description={t("landing.deliverables.alert.desc")}
        >
          <DeliverableAlertPreview />
        </DeliverableCard>

        <DeliverableCard
          title={t("landing.deliverables.ticket.title")}
          description={t("landing.deliverables.ticket.desc")}
        >
          <DeliverableTicketPreview />
        </DeliverableCard>

        <DeliverableCard
          title={t("landing.deliverables.proof.title")}
          description={t("landing.deliverables.proof.desc")}
        >
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <DeliverableReportPreview />
            <DeliverableSbomPreview />
          </Box>
        </DeliverableCard>
      </Box>
    </LandingSection>
  );
};
