import Box from "@mui/material/Box";
import GlobalStyles from "@mui/material/GlobalStyles";
import { useI18n } from "@/contexts/I18nContext";
import { LANDING_THEME } from "@/features/landing/constants";
import { DemoLauncher } from "@/features/landing/pages/LandingPage/components/DemoLauncher";
import { ClosingCta } from "@/features/landing/pages/LandingPage/components/ClosingCta";
import { Deliverables } from "@/features/landing/pages/LandingPage/components/Deliverables";
import { EcosystemLogos } from "@/features/landing/pages/LandingPage/components/EcosystemLogos";
import { Faq } from "@/features/landing/pages/LandingPage/components/Faq";
import { Hero } from "@/features/landing/pages/LandingPage/components/Hero";
import { HowItWorks } from "@/features/landing/pages/LandingPage/components/HowItWorks";
import { LandingFooter } from "@/features/landing/pages/LandingPage/components/LandingFooter";
import { LandingNav } from "@/features/landing/pages/LandingPage/components/LandingNav";
import { RuntimeTimeline } from "@/features/landing/pages/LandingPage/components/RuntimeTimeline";
import { ScoreReport } from "@/features/landing/pages/LandingPage/components/ScoreReport";

const REDUCED_MOTION_STYLES = {
  "@media (prefers-reduced-motion: reduce)": {
    html: { scrollBehavior: "auto" },
  },
} as const;

export const LandingPage = () => {
  const { ready } = useI18n();

  if (!ready)
    return (
      <Box
        sx={{
          ...LANDING_THEME,
          minHeight: "100dvh",
          background: "var(--page)",
        }}
      />
    );

  return (
    <Box
      sx={{
        ...LANDING_THEME,
        minHeight: "100dvh",
        overflowX: "clip",
        background: "var(--page)",
        color: "var(--ink)",
        fontFamily: "var(--font-text)",
        fontSize: "16px",
        lineHeight: 1.6,
        WebkitFontSmoothing: "antialiased",
        fontFeatureSettings: '"cv11"',
        "& :where(a)": { color: "inherit", textDecoration: "none" },
        "& :where(a):hover": { textDecoration: "none" },
        "& :where(:focus-visible)": {
          outline: "2px solid var(--indigo)",
          outlineOffset: "3px",
        },
      }}
    >
      <GlobalStyles styles={REDUCED_MOTION_STYLES} />
      <LandingNav />
      <Box component="main">
        <Hero />
        <DemoLauncher />
        <EcosystemLogos />
        <HowItWorks />
        <ScoreReport />
        <RuntimeTimeline />
        <Deliverables />
        <Faq />
        <ClosingCta />
      </Box>
      <LandingFooter />
    </Box>
  );
};
