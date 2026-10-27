import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import { LANDING_WRAP_SX } from "@/features/landing/constants";
import { GradePicker } from "@/features/landing/pages/LandingPage/components/ClosingCta/components/GradePicker";
import { ScanForm } from "@/features/landing/pages/LandingPage/components/ScanForm";

const TITLE_ID = "landing-closing-title";

export const ClosingCta: React.FC = () => {
  const t = useT();

  return (
    <Box
      component="section"
      aria-labelledby={TITLE_ID}
      sx={{ ...LANDING_WRAP_SX, pt: "64px" }}
    >
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          isolation: "isolate",
          background: "var(--night)",
          color: "var(--on-dark)",
          borderRadius: "32px",
          p: "80px 72px",
          display: "grid",
          gap: "56px",
          alignItems: "center",
          "&::before": {
            content: '""',
            position: "absolute",
            zIndex: -1,
            inset: "-40% -10% auto 30%",
            height: "140%",
            background:
              "radial-gradient(closest-side, color-mix(in srgb, var(--indigo) 45%, transparent), transparent)",
          },
          "@media (min-width:960px)": { gridTemplateColumns: "1.25fr 1fr" },
          "@media (max-width:700px)": { p: "56px 24px", textAlign: "center" },
        }}
      >
        <Box>
          <Box
            component="h2"
            id={TITLE_ID}
            sx={{
              m: 0,
              mb: "18px",
              maxWidth: 520,
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "clamp(32px, 4.4vw, 52px)",
              lineHeight: 1.04,
              letterSpacing: "-0.04em",
              textWrap: "balance",
              "@media (max-width:700px)": { mx: "auto" },
            }}
          >
            {t("landing.closing.title")}
          </Box>
          <Box
            component="p"
            sx={{
              m: 0,
              mb: "32px",
              maxWidth: 480,
              fontSize: "18px",
              color: "var(--night-muted)",
              "@media (max-width:700px)": { mx: "auto" },
            }}
          >
            {t("landing.closing.subtitle")}
          </Box>
          <ScanForm tone="dark" />
        </Box>
        <GradePicker />
      </Box>
    </Box>
  );
};
