import type React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { useT } from "@/contexts/I18nContext";
import {
  LANDING_EASING,
  LANDING_GRADES,
  LANDING_WRAP_SX,
} from "@/features/landing/constants";
import { landingGradeColorOf } from "@/features/landing/helpers";
import { ScanForm } from "@/features/landing/pages/LandingPage/components/ScanForm";

const TITLE_ID = "landing-closing-title";

export const ClosingCta: React.FC = () => {
  const t = useT();
  const [grade, setGrade] = useState(LANDING_GRADES[0]);

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
          background: "#121236",
          color: "#ffffff",
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
              "radial-gradient(closest-side, rgba(99,91,255,.45), transparent)",
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
              color: "#b9b8e6",
              "@media (max-width:700px)": { mx: "auto" },
            }}
          >
            {t("landing.closing.subtitle")}
          </Box>
          <ScanForm tone="dark" />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "36px",
          }}
        >
          <Box sx={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            {LANDING_GRADES.map((letter, index) => {
              const color = landingGradeColorOf(letter);
              const lowered = index % 2 === 0;
              const active = letter === grade;
              const show = () => setGrade(letter);
              return (
                <ButtonBase
                  type="button"
                  key={letter}
                  aria-pressed={active}
                  onMouseEnter={show}
                  onFocus={show}
                  onClick={show}
                  sx={{
                    border: 0,
                    p: 0,
                    cursor: "pointer",
                    width: "clamp(40px, 4.6vw, 64px)",
                    aspectRatio: "0.8",
                    borderRadius: "14px",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "clamp(22px, 2.8vw, 34px)",
                    color: "#ffffff",
                    background: color,
                    transform: active
                      ? `translateY(${lowered ? 12 : -6}px)`
                      : `translateY(${lowered ? 18 : 0}px)`,
                    boxShadow: active
                      ? `0 22px 34px -14px ${color}, 0 0 0 3px rgba(255,255,255,.85)`
                      : `0 18px 30px -16px ${color}`,
                    transition: `transform .25s ${LANDING_EASING}, box-shadow .25s`,
                    "&:focus-visible": { outline: "none" },
                    "@media (prefers-reduced-motion: reduce)": {
                      transition: "none",
                    },
                  }}
                >
                  {letter}
                </ButtonBase>
              );
            })}
          </Box>
          <Box
            component="p"
            aria-live="polite"
            sx={{
              m: 0,
              minHeight: 24,
              fontSize: "15.5px",
              color: "#c9c8f0",
              textAlign: "center",
            }}
          >
            <Box
              component="b"
              sx={{ color: "#ffffff", fontWeight: 600, mr: "6px" }}
            >
              {t("landing.closing.grade_label", { grade })}
            </Box>
            {t(`landing.grades.${grade.toLowerCase()}.desc`)}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
