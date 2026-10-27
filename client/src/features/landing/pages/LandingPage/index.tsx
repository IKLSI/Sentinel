import Box from "@mui/material/Box";
import GlobalStyles from "@mui/material/GlobalStyles";
import { useI18n } from "@/contexts/I18nContext";
import { LANDING_THEME, LANDING_WRAP_SX } from "@/features/landing/constants";
import { DemoLauncher } from "@/features/landing/pages/LandingPage/components/DemoLauncher";
import { ClosingCta } from "@/features/landing/pages/LandingPage/components/ClosingCta";
import { Deliverables } from "@/features/landing/pages/LandingPage/components/Deliverables";
import { EcosystemLogos } from "@/features/landing/pages/LandingPage/components/EcosystemLogos";
import { Faq } from "@/features/landing/pages/LandingPage/components/Faq";
import { HowItWorks } from "@/features/landing/pages/LandingPage/components/HowItWorks";
import { LandingFooter } from "@/features/landing/pages/LandingPage/components/LandingFooter";
import { LandingNav } from "@/features/landing/pages/LandingPage/components/LandingNav";
import { RuntimeTimeline } from "@/features/landing/pages/LandingPage/components/RuntimeTimeline";
import { ScanForm } from "@/features/landing/pages/LandingPage/components/ScanForm";
import { ScoreReport } from "@/features/landing/pages/LandingPage/components/ScoreReport";

const REDUCED_MOTION_STYLES = {
  "@media (prefers-reduced-motion: reduce)": {
    html: { scrollBehavior: "auto" },
  },
} as const;

export const LandingPage = () => {
  const { ready, t } = useI18n();

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
        <Box sx={{ ...LANDING_WRAP_SX, pt: "72px", textAlign: "center" }}>
          <Box
            component="h1"
            sx={{
              m: 0,
              mx: "auto",
              mb: "24px",
              maxWidth: 900,
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "clamp(40px, 6.4vw, 76px)",
              lineHeight: 1.02,
              letterSpacing: "-0.045em",
              textWrap: "balance",
              color: "var(--ink)",
            }}
          >
            {t("landing.hero.title")}
          </Box>
          <Box
            component="p"
            sx={{
              m: 0,
              mx: "auto",
              mb: "36px",
              maxWidth: 600,
              fontSize: "clamp(17px, 1.6vw, 19px)",
              color: "var(--ink-2)",
              textWrap: "pretty",
            }}
          >
            {t("landing.hero.description")}
          </Box>
          <ScanForm tone="light" />
          <Box sx={{ mt: "16px", fontSize: "14px", color: "var(--ink-3)" }}>
            {t("landing.hero.hint")}
          </Box>
        </Box>
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
