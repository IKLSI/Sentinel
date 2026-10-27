import type { Shadows } from "@mui/material/styles";

const darkShadowSteps = [
  "0 1px 2px rgba(0, 0, 0, 0.35)",
  "0 2px 6px rgba(0, 0, 0, 0.4)",
  "0 4px 12px rgba(0, 0, 0, 0.45)",
  "0 10px 28px rgba(0, 0, 0, 0.5)",
  "0 16px 40px rgba(0, 0, 0, 0.55)",
];

const lightShadowSteps = [
  "0 1px 2px rgba(16, 24, 40, 0.05)",
  "0 2px 6px rgba(16, 24, 40, 0.07)",
  "0 6px 16px rgba(16, 24, 40, 0.09)",
  "0 12px 32px rgba(16, 24, 40, 0.11)",
  "0 24px 60px rgba(16, 24, 40, 0.14)",
];

const MUI_SHADOW_LEVELS = 25;

const buildShadows = (steps: string[]) =>
  Array.from({ length: MUI_SHADOW_LEVELS }, (_, level) =>
    level === 0 ? "none" : steps[Math.min(level - 1, steps.length - 1)],
  ) as unknown as Shadows;

export const darkShadows = buildShadows(darkShadowSteps);

export const lightShadows = buildShadows(lightShadowSteps);
