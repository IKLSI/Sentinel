import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";

export const LoginShowcase: React.FC = () => {
  const t = useT();

  return (
    <Box className="lp-left">
      <Box className="lp-left-noise" aria-hidden />
      <Box className="lp-left-body">
        <Box className="lp-left-headline">
          <Box component="h1">
            {t("auth.login.headline_part1")}
            <br />
            <Box component="span" sx={{ whiteSpace: "nowrap" }}>
              {t("auth.login.headline_part2")}{" "}
              <Box component="span" className="lp-headline-accent">
                {t("auth.login.headline_accent")}
              </Box>
            </Box>
          </Box>
          <Box component="p" className="lp-headline-sub">
            {t("auth.login.headline_sub")}
          </Box>
        </Box>

        <Box className="lp-features">
          {[
            {
              icon: (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    stroke:
                      "color-mix(in srgb, var(--auth-indigo-300) 90%, transparent)",
                  }}
                  width="20"
                  height="20"
                >
                  <path d="M4 20a8 8 0 1 1 16 0" />
                  <path d="M12 20l4.5-5.5" />
                  <path d="M4.5 15.5h.01M7 10.5h.01M12 8.5h.01M17 10.5h.01" />
                </svg>
              ),
              title: t("auth.login.feature1_title"),
              desc: t("auth.login.feature1_desc"),
              iconBg:
                "color-mix(in srgb, var(--auth-indigo-300) 11%, transparent)",
            },
            {
              icon: (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    stroke:
                      "color-mix(in srgb, var(--auth-pink-300) 85%, transparent)",
                  }}
                  width="20"
                  height="20"
                >
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              ),
              title: t("auth.login.feature2_title"),
              desc: t("auth.login.feature2_desc"),
              iconBg:
                "color-mix(in srgb, var(--auth-pink-300) 11%, transparent)",
            },
            {
              icon: (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    stroke:
                      "color-mix(in srgb, var(--auth-amber-400) 85%, transparent)",
                  }}
                  width="20"
                  height="20"
                >
                  <rect x="3" y="3" width="7" height="9" rx="1" />
                  <rect x="14" y="3" width="7" height="5" rx="1" />
                  <rect x="14" y="12" width="7" height="9" rx="1" />
                  <rect x="3" y="16" width="7" height="5" rx="1" />
                </svg>
              ),
              title: t("auth.login.feature3_title"),
              desc: t("auth.login.feature3_desc"),
              iconBg:
                "color-mix(in srgb, var(--auth-amber-400) 11%, transparent)",
            },
          ].map((f, i) => (
            <Box
              key={f.title}
              className="lp-feature"
              style={{ animationDelay: `${0.52 + i * 0.1}s` }}
            >
              <Box className="lp-feature-icon" style={{ background: f.iconBg }}>
                {f.icon}
              </Box>
              <Box>
                <Box className="lp-feature-title">{f.title}</Box>
                <Box className="lp-feature-desc">{f.desc}</Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
