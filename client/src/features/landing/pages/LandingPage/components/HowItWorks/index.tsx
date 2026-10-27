import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import { TEXT_ELLIPSIS_SX } from "@/constants/display";
import {
  LANDING_SECTION_IDS,
  SHOWCASE,
  STEP_CHIP_SX,
  STEP_SOURCES,
} from "@/features/landing/constants";
import { REPOSITORY_HOST_LOGOS } from "@/features/landing/ecosystemLogos";
import { LandingSection } from "@/features/landing/pages/LandingPage/components/LandingSection";
import { SectionIntro } from "@/features/landing/pages/LandingPage/components/SectionIntro";
import { StepResult } from "@/features/landing/pages/LandingPage/components/HowItWorks/components/StepResult";

const TITLE_ID = "landing-how-it-works-title";

const STEP_IDS = ["connect", "cross", "result"] as const;

type StepId = (typeof STEP_IDS)[number];

const CONNECTED_REPOSITORIES = [
  { logo: REPOSITORY_HOST_LOGOS.github, name: SHOWCASE.onlineStoreRepository },
  {
    logo: REPOSITORY_HOST_LOGOS.gitlab,
    name: SHOWCASE.customerPortalRepository,
  },
] as const;

export const HowItWorks: React.FC = () => {
  const t = useT();
  const stepVisuals: Record<StepId, React.ReactNode> = {
    connect: (
      <>
        {CONNECTED_REPOSITORIES.map(({ logo, name }) => (
          <Box
            key={name}
            sx={{
              ...STEP_CHIP_SX,
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "9px",
              borderRadius: "12px",
              p: "10px 12px",
              fontSize: "13px",
              textAlign: "left",
              boxSizing: "border-box",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path d={logo} fill="var(--ink)" opacity={0.8} />
            </svg>
            <Box
              component="span"
              sx={{
                flex: 1,
                minWidth: 0,
                ...TEXT_ELLIPSIS_SX,
                color: "var(--ink)",
              }}
            >
              {name}
            </Box>
            <Box
              component="span"
              sx={{
                fontSize: "11.5px",
                fontWeight: 600,
                color: "var(--success)",
                background: "var(--success-soft)",
                px: "8px",
                py: "2px",
                borderRadius: "999px",
              }}
            >
              {t("landing.steps.connected")}
            </Box>
          </Box>
        ))}
      </>
    ),
    cross: (
      <>
        <Box
          sx={{
            background: "var(--ink)",
            color: "var(--indigo-100)",
            font: "400 12.5px var(--font-code)",
            px: "14px",
            py: "8px",
            borderRadius: "10px",
          }}
        >
          {SHOWCASE.manifest}
        </Box>
        <Box
          aria-hidden
          sx={{
            width: "70%",
            height: 18,
            border: "1.5px dashed var(--indigo-300)",
            borderBottom: 0,
            borderRadius: "10px 10px 0 0",
            boxSizing: "border-box",
          }}
        />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6px",
            width: "100%",
          }}
        >
          {STEP_SOURCES.map((source) => (
            <Box
              key={source}
              sx={{
                ...STEP_CHIP_SX,
                borderRadius: "10px",
                p: "7px 8px",
                fontSize: "12.5px",
                fontWeight: 500,
              }}
            >
              {source}
            </Box>
          ))}
        </Box>
      </>
    ),
    result: <StepResult />,
  };

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
        {STEP_IDS.map((id, index) => (
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
                    "repeating-linear-gradient(90deg, var(--indigo-300) 0 6px, transparent 6px 12px)",
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
                background: "var(--page)",
                boxShadow:
                  "0 0 0 1px var(--line), 0 6px 16px -8px color-mix(in srgb, var(--indigo) 35%, transparent)",
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
              {stepVisuals[id]}
            </Box>
          </Box>
        ))}
      </Box>
    </LandingSection>
  );
};
