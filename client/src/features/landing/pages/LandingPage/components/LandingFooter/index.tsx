import type React from "react";
import { Link } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import { ROUTES } from "@/constants/routes";
import { useT } from "@/contexts/I18nContext";
import {
  DATA_SOURCES,
  LANDING_SECTION_IDS,
  LANDING_WRAP_SX,
} from "@/features/landing/constants";
import { SentinelWordmark } from "@/components/layout/SentinelWordmark";
import { FooterColumn } from "@/features/landing/pages/LandingPage/components/FooterColumn";

const linkSx = {
  width: "fit-content",
  color: "var(--ink-2)",
  transition: "color .15s",
  "&:hover": { color: "var(--ink)" },
} as const;

const PRODUCT_ANCHORS = [
  { id: LANDING_SECTION_IDS.score, labelKey: "landing.footer.score" },
  { id: LANDING_SECTION_IDS.timeline, labelKey: "landing.footer.timeline" },
  { id: LANDING_SECTION_IDS.faq, labelKey: "landing.footer.faq" },
] as const;

export const LandingFooter: React.FC = () => {
  const t = useT();

  return (
    <Box
      component="footer"
      sx={{
        mt: "120px",
        borderTop: "1px solid var(--line)",
        background: "var(--page-alt)",
      }}
    >
      <Box sx={{ ...LANDING_WRAP_SX, pt: "64px" }}>
        <Box
          sx={{
            display: "grid",
            gap: "40px",
            gridTemplateColumns: "1fr 1fr",
            "@media (min-width:900px)": {
              gridTemplateColumns: "1.6fr 1fr 1fr 1fr",
              gap: "48px",
            },
          }}
        >
          <Box
            sx={{
              gridColumn: "1 / -1",
              "@media (min-width:900px)": { gridColumn: "auto" },
            }}
          >
            <Box
              component="a"
              href="#top"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: "9px",
                fontWeight: 600,
                fontSize: "16px",
                color: "var(--ink)",
              }}
            >
              <SentinelWordmark height={20} />
            </Box>
            <Box
              component="p"
              sx={{
                m: "14px 0 22px",
                maxWidth: 300,
                fontSize: "14.5px",
                color: "var(--ink-2)",
              }}
            >
              {t("landing.footer.tagline")}
            </Box>
          </Box>

          <FooterColumn title={t("landing.footer.product")}>
            <Box component={Link} to={ROUTES.SCAN} sx={linkSx}>
              {t("landing.footer.scan")}
            </Box>
            {PRODUCT_ANCHORS.map(({ id, labelKey }) => (
              <Box component="a" key={id} href={`#${id}`} sx={linkSx}>
                {t(labelKey)}
              </Box>
            ))}
            <Box component={Link} to={ROUTES.LOGIN} sx={linkSx}>
              {t("landing.footer.create_account")}
            </Box>
          </FooterColumn>

          <FooterColumn title={t("landing.footer.data_sources")}>
            {DATA_SOURCES.map(({ name, href }) => (
              <Box
                component="a"
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                sx={linkSx}
              >
                {name}
              </Box>
            ))}
          </FooterColumn>

          <FooterColumn title={t("landing.footer.information")}>
            <Box component={Link} to={ROUTES.LEGAL_NOTICE} sx={linkSx}>
              {t("landing.footer.legal_notice")}
            </Box>
            <Box component={Link} to={ROUTES.PRIVACY} sx={linkSx}>
              {t("landing.footer.privacy")}
            </Box>
            <Box component={Link} to={ROUTES.LOGIN} sx={linkSx}>
              {t("landing.nav.login")}
            </Box>
          </FooterColumn>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: "12px",
            mt: "56px",
            pt: "24px",
            pb: "36px",
            borderTop: "1px solid var(--line)",
            fontSize: "13.5px",
            color: "var(--ink-3)",
          }}
        >
          <span>
            {t("landing.footer.copyright", { year: new Date().getFullYear() })}
          </span>
          <span>{t("landing.footer.free")}</span>
        </Box>
      </Box>
    </Box>
  );
};
