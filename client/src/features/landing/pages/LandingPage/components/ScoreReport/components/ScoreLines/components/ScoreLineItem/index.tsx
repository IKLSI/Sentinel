import type React from "react";
import Box from "@mui/material/Box";
import { useI18n } from "@/contexts/I18nContext";
import type { ScoringExampleLine } from "@/domains/publicScan/types";
import { LANDING_EASING } from "@/features/landing/constants";
import {
  formatMultiplier,
  formatPoints,
  scoreLineColorOf,
} from "@/features/landing/helpers";
import { TEXT_ELLIPSIS_SX } from "@/constants/display";

interface ScoreLineItemProps {
  line: ScoringExampleLine;
  label: string;
  detail: string;
  maxPoints: number;
  isFirst: boolean;
}

export const ScoreLineItem: React.FC<ScoreLineItemProps> = ({
  line,
  label,
  detail,
  maxPoints,
  isFirst,
}) => {
  const { culture } = useI18n();
  const color = scoreLineColorOf(line.kind);
  const width = maxPoints > 0 ? (line.points / maxPoints) * 100 : 0;

  return (
    <Box
      component="li"
      sx={{
        display: "grid",
        gridTemplateColumns: "10px minmax(0,1fr) minmax(60px,150px) 52px",
        gap: "14px",
        alignItems: "center",
        py: "10px",
        borderTop: isFirst ? 0 : "1px solid var(--line)",
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
          ...TEXT_ELLIPSIS_SX,
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
};
