import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import type { ScoringExample, ScoringModel } from "@/domains/publicScan/types";
import { LANDING_EASING } from "@/features/landing/constants";
import { landingGradeColorOf } from "@/features/landing/helpers";

interface ScoreSummaryProps {
  example: ScoringExample;
  grades: ScoringModel["grades"];
}

const ceilingKeyOf = (reason: string | null) =>
  reason ? `landing.score.ceiling.${reason}` : "landing.score.ceiling.none";

export const ScoreSummary: React.FC<ScoreSummaryProps> = ({
  example,
  grades,
}) => {
  const t = useT();
  const color = landingGradeColorOf(example.grade);

  return (
    <Box
      sx={{
        background: "var(--tint)",
        p: "32px 28px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <Box
        component="span"
        sx={{ fontSize: "14px", fontWeight: 500, color: "var(--ink-2)" }}
      >
        {example.name}
      </Box>
      <Box
        key={example.name}
        aria-label={t("landing.score.grade_label", { grade: example.grade })}
        role="img"
        sx={{
          m: "14px 0 12px",
          width: 96,
          height: 112,
          borderRadius: "26px",
          display: "grid",
          placeItems: "center",
          background: color,
          color: "var(--on-dark)",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: "60px",
          lineHeight: 1,
          boxShadow: `0 24px 40px -22px ${color}`,
          "@keyframes landingGradePop": {
            from: { transform: "scale(.92)", opacity: 0.6 },
            to: { transform: "scale(1)", opacity: 1 },
          },
          animation: `landingGradePop .26s ${LANDING_EASING}`,
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        }}
      >
        {example.grade}
      </Box>
      <Box sx={{ fontVariantNumeric: "tabular-nums" }}>
        <Box
          component="b"
          sx={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "34px",
            letterSpacing: "-0.03em",
          }}
        >
          {example.score}
        </Box>
        <Box
          component="span"
          sx={{ ml: "6px", fontSize: "15px", color: "var(--ink-3)" }}
        >
          {t("landing.score.out_of_100")}
        </Box>
      </Box>
      <Box
        component="p"
        sx={{
          m: "8px 0 20px",
          maxWidth: 240,
          minHeight: 42,
          fontSize: "14px",
          color: "var(--ink-2)",
        }}
      >
        {t(ceilingKeyOf(example.ceilingReason), {
          ceiling: example.ceiling ?? "",
        })}
      </Box>
      <Box
        role="list"
        aria-label={t("landing.score.ladder_label")}
        sx={{ display: "flex", gap: "5px" }}
      >
        {grades.map(({ grade, minScore }) => {
          const active = grade === example.grade;
          return (
            <Box
              key={grade}
              role="listitem"
              title={t("landing.score.threshold", { score: minScore })}
              aria-current={active ? "true" : undefined}
              sx={{
                width: 30,
                height: 30,
                borderRadius: "9px",
                display: "grid",
                placeItems: "center",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--on-dark)",
                background: landingGradeColorOf(grade),
                opacity: active ? 1 : 0.22,
                transform: active ? "translateY(-3px)" : "none",
                transition: "opacity .3s, transform .3s",
              }}
            >
              {grade}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
