import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import {
  CI_INTEGRATION,
  ECOSYSTEMS,
  LANDING_WRAP_SX,
} from "@/features/landing/constants";
import { ECOSYSTEM_LOGOS } from "@/features/landing/ecosystemLogos";

const LOGO_NAMES = [...ECOSYSTEMS, CI_INTEGRATION];

export const EcosystemLogos: React.FC = () => {
  const t = useT();

  return (
    <Box
      sx={{ ...LANDING_WRAP_SX, pt: "88px", pb: "40px", textAlign: "center" }}
    >
      <Box
        component="p"
        sx={{ m: 0, mb: "28px", fontSize: "15px", color: "var(--ink-3)" }}
      >
        {t("landing.ecosystems.title", {
          count: ECOSYSTEMS.length,
          ci: CI_INTEGRATION,
        })}
      </Box>
      <Box
        component="ul"
        sx={{
          listStyle: "none",
          m: 0,
          mx: "auto",
          p: 0,
          maxWidth: 980,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "18px 36px",
          "@media (min-width:1000px)": {
            display: "grid",
            gridTemplateColumns: "repeat(7, auto)",
            gap: "22px 44px",
          },
        }}
      >
        {LOGO_NAMES.map((name) => (
          <Box
            component="li"
            key={name}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--ink-2)",
              transition: "color .2s",
              "& svg": { opacity: 0.55, transition: "opacity .2s" },
              "&:hover": { color: "var(--ink)" },
              "&:hover svg": { opacity: 0.9 },
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d={ECOSYSTEM_LOGOS[name]} fill="var(--ink)" />
            </svg>
            {name}
          </Box>
        ))}
      </Box>
    </Box>
  );
};
