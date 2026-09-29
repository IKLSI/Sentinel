import Box from "@mui/material/Box";
import { LandingNav } from "@/features/landing/pages/LandingPage/components/LandingNav";
import { Hero } from "@/features/landing/pages/LandingPage/components/Hero";
import { GradeScale } from "@/features/landing/pages/LandingPage/components/GradeScale";
import { ProcessSteps } from "@/features/landing/pages/LandingPage/components/ProcessSteps";
import { CompareTable } from "@/features/landing/pages/LandingPage/components/CompareTable";
import { EcosystemChips } from "@/features/landing/pages/LandingPage/components/EcosystemChips";
import { Faq } from "@/features/landing/pages/LandingPage/components/Faq";
import { CtaDark } from "@/features/landing/pages/LandingPage/components/CtaDark";
import { LandingFooter } from "@/features/landing/pages/LandingPage/components/LandingFooter";

export const LandingPage = () => (
  <Box
    sx={{
      minHeight: "100dvh",
      background: "#eef2ff",
      color: "var(--text)",
      "--bg": "#ffffff",
      "--s1": "#ffffff",
      "--s2": "#f5f7fc",
      "--s3": "#eaedfa",
      "--border": "#dde3f2",
      "--border2": "#c8d2eb",
      "--text": "#0e1220",
      "--text-secondary": "#3a4768",
      "--muted": "#8898bb",
      "--muted2": "#5c6f90",
    }}
  >
    <LandingNav />
    <Hero />
    <GradeScale />
    <ProcessSteps />
    <CompareTable />
    <EcosystemChips />
    <Faq />
    <CtaDark />
    <LandingFooter />
  </Box>
);
