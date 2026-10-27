import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import type { ScanProgress } from "@/domains/projects/types";
import { fadeInUp, progressSweep, REDUCED_MOTION } from "@/styles/keyframes";
import { TEXT_ELLIPSIS_SX } from "@/constants/display";

interface Props {
  progress: ScanProgress;
  width?: string | number;
}

const SEGMENT_SX = {
  position: "relative",
  flex: 1,
  height: "5px",
  borderRadius: "999px",
  overflow: "hidden",
  transition: "background 0.4s ease",
} as const;

const ACTIVE_SEGMENT_SX = {
  background: "color-mix(in srgb, var(--accent) 28%, transparent)",
  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(90deg, transparent, var(--accent), transparent)",
    animation: `${progressSweep} 1.1s ease-in-out infinite`,
  },
  [REDUCED_MOTION]: {
    background: "var(--accent)",
    "&::after": { display: "none" },
  },
} as const;

const segmentSx = (step: number, currentStep: number) => {
  if (step < currentStep) return { ...SEGMENT_SX, background: "var(--accent)" };
  if (step === currentStep) return { ...SEGMENT_SX, ...ACTIVE_SEGMENT_SX };
  return { ...SEGMENT_SX, background: "var(--border)" };
};

export const ScanProgressBar: React.FC<Props> = ({ progress, width = 120 }) => {
  const t = useT();
  const steps = Array.from(
    { length: progress.totalSteps },
    (_, index) => index + 1,
  );

  return (
    <Box
      role="status"
      aria-label={t("tech_health.scan_stage.aria", {
        stage: t(`tech_health.scan_stage.${progress.stage}`),
        step: progress.step,
        total: progress.totalSteps,
      })}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        minWidth: 0,
      }}
    >
      <Box sx={{ display: "flex", gap: "3px", width, flexShrink: 0 }}>
        {steps.map((step) => (
          <Box key={step} sx={segmentSx(step, progress.step)} />
        ))}
      </Box>
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "baseline",
          flexShrink: 0,
          px: "6px",
          py: "1px",
          borderRadius: "999px",
          background: "var(--accent-subtle)",
          fontSize: "10.5px",
          lineHeight: 1.4,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <Box component="span" sx={{ fontWeight: 700, color: "var(--accent)" }}>
          {progress.step}
        </Box>
        <Box component="span" sx={{ color: "var(--muted2)" }}>
          /{progress.totalSteps}
        </Box>
      </Box>
      <Box
        key={progress.stage}
        component="span"
        sx={{
          fontSize: "11px",
          fontWeight: 500,
          color: "var(--text-secondary)",
          ...TEXT_ELLIPSIS_SX,
          animation: `${fadeInUp} 0.25s ease-out`,
          [REDUCED_MOTION]: { animation: "none" },
        }}
      >
        {t(`tech_health.scan_stage.${progress.stage}`)}
      </Box>
    </Box>
  );
};
