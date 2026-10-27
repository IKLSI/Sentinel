import type React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { useT } from "@/contexts/I18nContext";
import { LANDING_EASING, LANDING_GRADES } from "@/features/landing/constants";
import { landingGradeColorOf } from "@/features/landing/helpers";

const GRADE_OFFSETS = {
  active: { lowered: 12, raised: -6 },
  idle: { lowered: 18, raised: 0 },
} as const;

const gradeOffset = (active: boolean, lowered: boolean) => {
  const offsets = active ? GRADE_OFFSETS.active : GRADE_OFFSETS.idle;
  return lowered ? offsets.lowered : offsets.raised;
};

export const GradePicker: React.FC = () => {
  const t = useT();
  const [grade, setGrade] = useState(LANDING_GRADES[0]);

  return (
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
                color: "var(--on-dark)",
                background: color,
                transform: `translateY(${gradeOffset(active, lowered)}px)`,
                boxShadow: active
                  ? `0 22px 34px -14px ${color}, 0 0 0 3px color-mix(in srgb, var(--on-dark) 85%, transparent)`
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
          color: "var(--night-text)",
          textAlign: "center",
        }}
      >
        <Box
          component="b"
          sx={{ color: "var(--on-dark)", fontWeight: 600, mr: "6px" }}
        >
          {t("landing.closing.grade_label", { grade })}
        </Box>
        {t(`landing.grades.${grade.toLowerCase()}.desc`)}
      </Box>
    </Box>
  );
};
