import type React from "react";
import Box from "@mui/material/Box";
import { useI18n } from "@/contexts/I18nContext";
import type { ScoringExample } from "@/domains/publicScan/types";
import { describeScoreLine, formatPoints } from "@/features/landing/helpers";
import { ScoreLineItem } from "@/features/landing/pages/LandingPage/components/ScoreReport/components/ScoreLines/components/ScoreLineItem";

const SMALL_LABEL_SX = {
  display: "inline",
  mr: "8px",
  fontSize: "12px",
  color: "var(--ink-3)",
} as const;

interface ScoreLinesProps {
  example: ScoringExample;
  maxScore: number;
  decayConstant: number;
}

export const ScoreLines: React.FC<ScoreLinesProps> = ({
  example,
  maxScore,
  decayConstant,
}) => {
  const { t, culture } = useI18n();
  const maxPoints = Math.max(...example.lines.map((line) => line.points), 0);
  const capped = example.score < example.rawScore;

  return (
    <Box
      sx={{
        p: "28px 36px 24px",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        "@media (max-width:640px)": { p: "28px 20px" },
      }}
    >
      <Box
        component="h3"
        sx={{ m: 0, mb: "14px", fontSize: "15px", fontWeight: 600 }}
      >
        {t("landing.score.lines_title")}
      </Box>
      <Box
        component="ul"
        key={example.name}
        sx={{ listStyle: "none", m: 0, p: 0 }}
      >
        {example.lines.map((line, index) => {
          const { label, detail } = describeScoreLine(line, t, culture);
          return (
            <ScoreLineItem
              key={`${line.kind}-${line.modifiers.join("-")}-${label}-${detail}`}
              line={line}
              label={label}
              detail={detail}
              maxPoints={maxPoints}
              isFirst={index === 0}
            />
          );
        })}
      </Box>
      <Box
        sx={{
          mt: "auto",
          pt: "18px",
          borderTop: "1px solid var(--line)",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: "12px 24px",
          fontSize: "13.5px",
          color: "var(--ink-3)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <Box component="span">
          <Box component="small" sx={SMALL_LABEL_SX}>
            {t("landing.score.total_label")}
          </Box>
          <Box
            component="b"
            sx={{ fontSize: "17px", fontWeight: 600, color: "var(--ink)" }}
          >
            {t("landing.score.total_points", {
              points: formatPoints(example.totalPenalty, culture),
            })}
          </Box>
        </Box>
        <Box component="span" sx={{ textAlign: "right" }}>
          <Box component="small" sx={SMALL_LABEL_SX}>
            {t("landing.score.calculation_label")}
          </Box>
          <Box
            component="span"
            sx={{
              fontSize: "15px",
              color: "var(--ink-2)",
              fontVariantNumeric: "tabular-nums",
              "& b": { color: "var(--ink)", fontWeight: 600 },
              "& sup": { fontSize: "0.7em", ml: "1px" },
            }}
          >
            {maxScore} × e
            <sup>
              {formatPoints(example.totalPenalty, culture)} ÷ {decayConstant}
            </sup>{" "}
            = <b>{example.rawScore}</b>
            {capped && (
              <>
                {t("landing.score.capped_at")} <b>{example.score}</b>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
