import type React from "react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import { ROUTES } from "@/constants/routes";
import { useT } from "@/contexts/I18nContext";
import { NAV_LINKS } from "@/features/landing/constants";
import { SentinelLogo } from "@/components/layout/SentinelLogo";
import { LanguageToggle } from "@/features/landing/pages/LandingPage/components/LanguageToggle";

const SCROLL_THRESHOLD = 8;
const LINKS_BREAKPOINT = "@media (min-width:1060px)";
const FOCUS_RING = {
  outline: "2px solid var(--ink)",
  outlineOffset: "2px",
};

export const LandingNav: React.FC = () => {
  const t = useT();
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting) setActiveId(id);
          else setActiveId((current) => (current === id ? null : current));
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const { id } of NAV_LINKS) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        px: { xs: "16px", md: "24px" },
        pt: { xs: "14px", md: "18px" },
        pointerEvents: "none",
      }}
    >
      <Box
        sx={{
          pointerEvents: "auto",
          mx: "auto",
          maxWidth: 960,
          height: 56,
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "center",
          gap: "16px",
          pl: "10px",
          pr: "8px",
          boxSizing: "border-box",
          borderRadius: "22px",
          background:
            "linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.74))",
          backdropFilter: "saturate(1.8) blur(16px)",
          WebkitBackdropFilter: "saturate(1.8) blur(16px)",
          boxShadow: scrolled
            ? "inset 0 1px 0 rgba(255,255,255,.9), 0 0 0 1px rgba(16,17,36,.07), 0 18px 40px -18px rgba(40,36,120,.32)"
            : "inset 0 1px 0 rgba(255,255,255,.9), 0 0 0 1px rgba(16,17,36,.06), 0 1px 2px rgba(16,17,36,.04), 0 12px 32px -16px rgba(40,36,120,.22)",
          transition: "box-shadow .3s",
          [LINKS_BREAKPOINT]: { gridTemplateColumns: "1fr auto 1fr" },
          "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        }}
      >
        <Box
          component="a"
          href="#top"
          sx={{
            justifySelf: "start",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            p: "6px 10px 6px 6px",
            borderRadius: "14px",
            fontWeight: 700,
            fontSize: "15px",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "var(--ink)",
            "&:focus-visible": FOCUS_RING,
          }}
        >
          <SentinelLogo width={26} height={30} />
          Sentinel
        </Box>

        <Box
          component="nav"
          aria-label={t("landing.nav.sections_label")}
          sx={{
            position: "relative",
            display: "none",
            alignItems: "center",
            gap: "4px",
            [LINKS_BREAKPOINT]: { display: "flex" },
          }}
        >
          {NAV_LINKS.map(({ id, labelKey }) => (
            <Box
              key={id}
              component="a"
              href={`#${id}`}
              aria-current={activeId === id ? "true" : undefined}
              sx={{
                position: "relative",
                display: "inline-flex",
                px: "12px",
                py: "7px",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 500,
                color: activeId === id ? "var(--ink)" : "var(--ink-2)",
                transition: "color .2s",
                "&:hover": { color: "var(--ink)" },
                "&:focus-visible": FOCUS_RING,
                "&::after": {
                  content: '""',
                  position: "absolute",
                  left: "50%",
                  bottom: "1px",
                  width: "4px",
                  height: "4px",
                  ml: "-2px",
                  borderRadius: "50%",
                  background: "var(--ink)",
                  opacity: activeId === id ? 1 : 0,
                },
              }}
            >
              {t(labelKey)}
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            justifySelf: "end",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <Box
            component={Link}
            to={ROUTES.LOGIN}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              height: 42,
              px: "18px",
              borderRadius: "14px",
              whiteSpace: "nowrap",
              fontSize: "14px",
              fontWeight: 600,
              color: "#ffffff",
              background: "linear-gradient(180deg, #2a2c4f, #101124)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,.14), 0 6px 16px -8px rgba(16,17,36,.6)",
              "&:hover": {
                background: "linear-gradient(180deg, #34376a, #1a1c38)",
              },
              "&:focus-visible": FOCUS_RING,
            }}
          >
            {t("landing.nav.login")}
          </Box>
          <Box
            aria-hidden
            sx={{
              width: "1px",
              height: 22,
              background: "var(--line)",
              "@media (max-width:480px)": { display: "none" },
            }}
          />
          <Box
            sx={{
              display: "inline-flex",
              "@media (max-width:420px)": { display: "none" },
            }}
          >
            <LanguageToggle size="sm" />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
