import type { ThemeOptions } from "@mui/material/styles";

export const darkPalette: ThemeOptions["palette"] = {
  mode: "dark",
  primary: { main: "#818cf8", dark: "#6366f1", contrastText: "#111111" },
  secondary: { main: "#a5a0e8", dark: "#6d5fc4" },
  error: { main: "#f87171" },
  success: { main: "#4ade80" },
  warning: { main: "#fbbf24" },
  info: { main: "#22d3ee" },
  background: { default: "#111111", paper: "#181818" },
  text: {
    primary: "#f2f2f2",
    secondary: "#c4c4c4",
    disabled: "#909090",
  },
  divider: "#2a2a2a",
  action: {
    hover: "rgba(255,255,255,0.05)",
    selected: "rgba(129, 140, 248, 0.16)",
    disabled: "#909090",
    disabledBackground: "#272727",
  },
};

export const lightPalette: ThemeOptions["palette"] = {
  mode: "light",
  primary: { main: "#4f46e5", dark: "#3730a3" },
  secondary: { main: "#7c6fcd", dark: "#6a5eb8" },
  error: { main: "#dc2626" },
  success: { main: "#16a34a" },
  warning: { main: "#d97706" },
  background: { default: "#f0f2f8", paper: "#ffffff" },
  text: { primary: "#0e1220", secondary: "#4d5e82" },
  divider: "#dde3f2",
  action: {
    hover: "rgba(0,0,0,0.03)",
    selected: "rgba(79, 70, 229, 0.08)",
  },
};
