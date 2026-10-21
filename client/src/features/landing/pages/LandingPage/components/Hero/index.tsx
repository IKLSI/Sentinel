import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import { LANDING_WRAP_SX } from "@/features/landing/constants";
import { ScanForm } from "@/features/landing/pages/LandingPage/components/ScanForm";

export const Hero: React.FC = () => {
  const t = useT();

  return (
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
  );
};
