import type React from "react";
import Box from "@mui/material/Box";
import { useI18n } from "@/contexts/I18nContext";
import type { ScoringExample } from "@/domains/publicScan/types";
import { LANDING_EASING } from "@/features/landing/constants";
import {
  describeScoreLine,
  formatMultiplier,
  formatPoints,
  scoreLineColorOf,
} from "@/features/landing/helpers";

interface ScoreLinesProps {
  example: ScoringExample;
  maxScore: number;
  decayConstant: number;
}

const smallLabelSx = {
  display: "inline",
  mr: "8px",
  fontSize: "12px",
  color: "var(--ink-3)",
} as const;

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
          const color = scoreLineColorOf(line.kind);
          const width = maxPoints > 0 ? (line.points / maxPoints) * 100 : 0;
          return (
            <Box
              component="li"
              key={`${line.kind}-${line.modifiers.join("-")}-${label}-${detail}`}
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "10px minmax(0,1fr) minmax(60px,150px) 52px",
                gap: "14px",
                alignItems: "center",
                py: "10px",
                borderTop: index === 0 ? 0 : "1px solid var(--line)",
                "@media (max-width:560px)": {
                  gridTemplateColumns: "10px 1fr 48px",
                },
              }}
            >
              <Box
                component="span"
                aria-hidden
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: color,
                }}
              />
              <Box
                component="span"
                title={detail ? `${label} — ${detail}` : label}
                sx={{
                  minWidth: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                <Box component="b" sx={{ fontWeight: 500, fontSize: "15px" }}>
                  {label}
                </Box>
                {line.multiplier != null && (
                  <Box
                    component="em"
                    sx={{
                      fontStyle: "normal",
                      ml: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      px: "8px",
                      py: "2px",
                      borderRadius: "999px",
                      background: "var(--danger-soft)",
                      color: "var(--danger)",
                      verticalAlign: "1px",
                    }}
                  >
                    {formatMultiplier(line.multiplier, culture)}
                  </Box>
                )}
                {detail && (
                  <Box
                    component="small"
                    sx={{ ml: "8px", fontSize: "13px", color: "var(--ink-3)" }}
                  >
                    {detail}
                  </Box>
                )}
              </Box>
              <Box
                component="span"
                aria-hidden
                sx={{
                  height: 6,
                  borderRadius: "999px",
                  background: "var(--tint)",
                  overflow: "hidden",
                  "@media (max-width:560px)": { display: "none" },
                }}
              >
                <Box
                  component="i"
                  sx={{
                    display: "block",
                    height: "100%",
                    width: `${width}%`,
                    borderRadius: "999px",
                    background: color,
                    transformOrigin: "left center",
                    "@keyframes landingBarGrow": {
                      from: { transform: "scaleX(0)" },
                      to: { transform: "scaleX(1)" },
                    },
                    animation: `landingBarGrow .6s ${LANDING_EASING}`,
                    "@media (prefers-reduced-motion: reduce)": {
                      animation: "none",
                    },
                  }}
                />
              </Box>
              <Box
                component="span"
                sx={{
                  textAlign: "right",
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatPoints(line.points, culture)}
              </Box>
            </Box>
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
          <Box component="small" sx={smallLabelSx}>
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
          <Box component="small" sx={smallLabelSx}>
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
