import { useState } from "react";
import { Link } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuOutlined from "@mui/icons-material/MenuOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import ArrowForwardOutlined from "@mui/icons-material/ArrowForwardOutlined";
import { SentinelLogo } from "@/components/layout/SentinelLogo";
import { ROUTES } from "@/constants/routes";
import { useI18n } from "@/contexts/I18nContext";

const LINKS = [
  { href: "#fonctionnalites", labelKey: "landing.nav.features" },
  { href: "#faq", labelKey: "landing.nav.faq" },
] as const;

export const LandingNav = () => {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  return (
    <Box
      component="nav"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        pt: { xs: "16px", md: "20px" },
        pl: { xs: "16px", md: "168px" },
        pr: { xs: "142px", md: "168px" },
      }}
    >
      <Box
        sx={{
          maxWidth: 980,
          mx: "auto",
          display: { xs: "flex", md: "grid" },
          gridTemplateColumns: { md: "1fr auto 1fr" },
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          px: { xs: "16px", md: "24px" },
          py: "12px",
          borderRadius: "999px",
          border: "1px solid var(--border)",
          background: "color-mix(in srgb, var(--s1) 82%, transparent)",
          backdropFilter: "blur(18px) saturate(160%)",
          boxShadow: "var(--sh-2)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: 700,
            fontSize: "16px",
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            color: "var(--text)",
          }}
        >
          <SentinelLogo width={22} height={26} />
          Sentinel
        </Box>

        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            gap: "4px",
          }}
        >
          {LINKS.map((link) => (
            <Box
              key={link.href}
              component="a"
              href={link.href}
              sx={{
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "0.03em",
                textTransform: "uppercase",
                color: "var(--text-secondary)",
                textDecoration: "none",
                px: "14px",
                py: "8px",
                borderRadius: "var(--r-sm)",
                transition: "color 0.15s",
                "&:hover": { color: "var(--text)", textDecoration: "none" },
              }}
            >
              {t(link.labelKey)}
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "8px",
          }}
        >
          <Button
            component={Link}
            to={ROUTES.LOGIN}
            variant="contained"
            size="small"
            sx={{
              px: "18px",
              borderRadius: "999px",
              boxShadow: "0 8px 20px -8px var(--accent-border)",
              textTransform: "uppercase",
            }}
          >
            {t("landing.nav.start")}
          </Button>
        </Box>

        <IconButton
          aria-label={t("landing.nav.menu_label")}
          sx={{ display: { xs: "inline-flex", md: "none" } }}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <CloseOutlined /> : <MenuOutlined />}
        </IconButton>
      </Box>

      {open && (
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            flexDirection: "column",
            gap: "4px",
            maxWidth: 980,
            mx: "auto",
            mt: "10px",
            p: "10px",
            borderRadius: "20px",
            border: "1px solid var(--border)",
            background: "var(--s1)",
            boxShadow: "var(--sh-3)",
          }}
        >
          {LINKS.map((link) => (
            <Box
              key={link.href}
              component="a"
              href={link.href}
              onClick={() => setOpen(false)}
              sx={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                textDecoration: "none",
                p: "12px 14px",
                borderRadius: "12px",
                "&:hover": { color: "var(--text)", textDecoration: "none" },
              }}
            >
              {t(link.labelKey)}
            </Box>
          ))}
          <Box
            sx={{
              mt: "8px",
              pt: "10px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <Button
              component={Link}
              to={ROUTES.LOGIN}
              variant="contained"
              size="large"
              fullWidth
              endIcon={<ArrowForwardOutlined sx={{ fontSize: 18 }} />}
              sx={{
                py: "12px",
                fontSize: "15px",
                borderRadius: "var(--r-lg)",
                boxShadow: "0 12px 28px -10px var(--accent-border)",
              }}
            >
              {t("landing.nav.free_trial")}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};
