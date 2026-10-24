import type React from "react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import { ROUTES } from "@/constants/routes";
import { useT } from "@/contexts/I18nContext";
import { NAV_LINKS } from "@/features/landing/constants";
import { SentinelWordmark } from "@/components/layout/SentinelWordmark";
import { LanguageToggle } from "@/features/landing/pages/LandingPage/components/LanguageToggle";

const SCROLL_THRESHOLD = 8;
const LINKS_BREAKPOINT = "@media (min-width:1060px)";
const WIDE_BREAKPOINT = "@media (min-width:1280px)";
const FOCUS_RING = {
  outline: "2px solid var(--ink)",
  outlineOffset: "2px",
};

const PILL_BACKGROUND =
  "linear-gradient(180deg, color-mix(in srgb, var(--on-dark) 92%, transparent), color-mix(in srgb, var(--on-dark) 74%, transparent))";

const pillShadow = (scrolled: boolean) =>
  scrolled
    ? "inset 0 1px 0 color-mix(in srgb, var(--on-dark) 90%, transparent), 0 0 0 1px color-mix(in srgb, var(--ink) 7%, transparent), 0 18px 40px -18px color-mix(in srgb, var(--night) 32%, transparent)"
    : "inset 0 1px 0 color-mix(in srgb, var(--on-dark) 90%, transparent), 0 0 0 1px color-mix(in srgb, var(--ink) 6%, transparent), 0 1px 2px color-mix(in srgb, var(--ink) 4%, transparent), 0 12px 32px -16px color-mix(in srgb, var(--night) 22%, transparent)";

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
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          alignItems: "center",
          gap: "10px",
          [WIDE_BREAKPOINT]: {
            gridTemplateColumns: "1fr minmax(0, 960px) 1fr",
          },
        }}
      >
        <Box
          sx={{
            pointerEvents: "auto",
            width: "100%",
            maxWidth: 960,
            justifySelf: "center",
            [WIDE_BREAKPOINT]: { gridColumn: 2 },
            height: 56,
            display: "grid",
            gridTemplateColumns: "1fr auto",
            alignItems: "center",
            gap: "16px",
            pl: "10px",
            pr: "8px",
            boxSizing: "border-box",
            borderRadius: "22px",
            background: PILL_BACKGROUND,
            backdropFilter: "saturate(1.8) blur(16px)",
            WebkitBackdropFilter: "saturate(1.8) blur(16px)",
            boxShadow: pillShadow(scrolled),
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
            <SentinelWordmark height={22} />
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
                color: "var(--on-dark)",
                background: "var(--ink)",
                boxShadow:
                  "0 6px 16px -8px color-mix(in srgb, var(--ink) 60%, transparent)",
                "&:hover": {
                  background: "var(--ink-hover)",
                },
                "&:focus-visible": FOCUS_RING,
              }}
            >
              {t("landing.nav.login")}
            </Box>
          </Box>
        </Box>
        <Box
          sx={{
            pointerEvents: "auto",
            justifySelf: "end",
            [WIDE_BREAKPOINT]: { gridColumn: 3 },
            height: 56,
            p: "6px",
            boxSizing: "border-box",
            alignItems: "center",
            borderRadius: "22px",
            background: PILL_BACKGROUND,
            backdropFilter: "saturate(1.8) blur(16px)",
            WebkitBackdropFilter: "saturate(1.8) blur(16px)",
            boxShadow: pillShadow(scrolled),
            transition: "box-shadow .3s",
            display: "flex",
            "@media (max-width:420px)": { display: "none" },
            "@media (prefers-reduced-motion: reduce)": { transition: "none" },
          }}
        >
          <LanguageToggle />
        </Box>
      </Box>
    </Box>
  );
};
