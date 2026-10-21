import { createTheme, type Theme } from "@mui/material/styles";
import { lightTheme } from "@/configs/themes";

const CSS_VARIABLE_PATTERN = /(--[\w-]+)\s*:\s*([^;]+);/g;

const DESKTOP_ONLY_BREAKPOINTS = {
  xs: 0,
  sm: 0,
  md: 0,
  lg: 0,
  xl: Number.MAX_SAFE_INTEGER,
};

const GLOBAL_LIGHT_VARIABLES = {
  "--sky": "#38bdf8",
  "--sky-subtle": "rgba(56, 189, 248, 0.12)",
  "--sky-border": "rgba(56, 189, 248, 0.25)",
  "--violet": "#8b5cf6",
  "--violet-subtle": "rgba(139, 92, 246, 0.12)",
  "--violet-border": "rgba(139, 92, 246, 0.25)",
  "--emerald": "#10b981",
  "--emerald-subtle": "rgba(16, 185, 129, 0.12)",
  "--emerald-border": "rgba(16, 185, 129, 0.25)",
  "--slate": "#64748b",
  "--slate-subtle": "rgba(100, 116, 139, 0.12)",
  "--slate-border": "rgba(100, 116, 139, 0.2)",
  "--rose": "#f43f5e",
  "--rose-subtle": "rgba(244, 63, 94, 0.12)",
  "--rose-border": "rgba(244, 63, 94, 0.25)",
  "--teal": "#14b8a6",
  "--teal-subtle": "rgba(20, 184, 166, 0.12)",
  "--teal-border": "rgba(20, 184, 166, 0.25)",
  "--cta": "#7c6fcd",
  "--cta-2": "#6a5eb8",
  "--avatar-peer-1": "#fda4af",
  "--avatar-peer-2": "#fb7185",
};

const themeLightVariables = (): Record<string, string> => {
  const source = lightTheme.components?.MuiCssBaseline?.styleOverrides;
  const css = typeof source === "string" ? source : "";
  return Object.fromEntries(
    [...css.matchAll(CSS_VARIABLE_PATTERN)].map(([, name, value]) => [
      name,
      value.trim(),
    ]),
  );
};

export const DEMO_LIGHT_VARIABLES: Record<string, string> = {
  ...themeLightVariables(),
  ...GLOBAL_LIGHT_VARIABLES,
};

export const demoTheme: Theme = {
  ...lightTheme,
  breakpoints: createTheme({
    breakpoints: { values: DESKTOP_ONLY_BREAKPOINTS },
  }).breakpoints,
};
