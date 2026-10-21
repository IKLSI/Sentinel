import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import { LANDING_SECTION_IDS } from "@/features/landing/constants";
import { LandingSection } from "@/features/landing/pages/LandingPage/components/LandingSection";
import { SectionIntro } from "@/features/landing/pages/LandingPage/components/SectionIntro";
import { StepRepositories } from "@/features/landing/pages/LandingPage/components/StepRepositories";
import { StepResult } from "@/features/landing/pages/LandingPage/components/StepResult";
import { StepSources } from "@/features/landing/pages/LandingPage/components/StepSources";

const TITLE_ID = "landing-how-it-works-title";

const STEPS = [
  { id: "connect", Visual: StepRepositories },
  { id: "cross", Visual: StepSources },
  { id: "result", Visual: StepResult },
] as const;

export const HowItWorks: React.FC = () => {
  const t = useT();

  return (
    <LandingSection id={LANDING_SECTION_IDS.howItWorks} labelledBy={TITLE_ID}>
      <SectionIntro
        titleId={TITLE_ID}
        title={t("landing.steps.title")}
        description={t("landing.steps.subtitle")}
      />
      <Box
        component="ol"
        sx={{
          listStyle: "none",
          m: 0,
          mx: "auto",
          p: 0,
          maxWidth: 1040,
          display: "grid",
          gap: "40px",
          gridTemplateColumns: "1fr",
          alignItems: "stretch",
          "@media (min-width:860px)": {
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "48px",
          },
        }}
      >
        {STEPS.map(({ id, Visual }, index) => (
          <Box
            component="li"
            key={id}
            sx={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              "@media (min-width:860px)": {
                "&:not(:last-of-type)::after": {
                  content: '""',
                  position: "absolute",
                  top: "22px",
                  left: "calc(50% + 34px)",
                  width: "calc(100% - 68px + 48px)",
                  height: "1px",
                  background:
                    "repeating-linear-gradient(90deg, #cfcdf5 0 6px, transparent 6px 12px)",
                },
              },
            }}
          >
            <Box
              component="span"
              aria-hidden
              sx={{
                position: "relative",
                zIndex: 1,
                display: "inline-grid",
                placeItems: "center",
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "#ffffff",
                boxShadow:
                  "0 0 0 1px var(--line), 0 6px 16px -8px rgba(80,72,229,.35)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "18px",
                color: "var(--indigo)",
              }}
            >
              {index + 1}
            </Box>
            <Box
              component="h3"
              sx={{
                m: "18px 0 8px",
                fontSize: "18px",
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              {t(`landing.steps.${id}.title`)}
            </Box>
            <Box
              component="p"
              sx={{
                m: 0,
                mx: "auto",
                mb: "28px",
                maxWidth: "32ch",
                fontSize: "15.5px",
                color: "var(--ink-2)",
              }}
            >
              {t(`landing.steps.${id}.desc`)}
            </Box>
            <Box
              sx={{
                mt: "auto",
                width: "100%",
                height: 178,
                boxSizing: "border-box",
                background: "var(--tint)",
                borderRadius: "22px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                p: "18px",
              }}
            >
              <Visual />
            </Box>
          </Box>
        ))}
      </Box>
    </LandingSection>
  );
};
