import { createTheme } from "@mui/material/styles";
import type { ThemeOptions } from "@mui/material/styles";
import { baseComponents } from "./components";
import { darkCssVars, lightCssVars } from "./cssVars";
import { darkPalette, lightPalette } from "./palettes";
import { darkShadows, lightShadows } from "./shadows";

const sharedThemeOptions: Pick<ThemeOptions, "shape" | "typography"> = {
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    button: { textTransform: "none", fontWeight: 600 },
  },
};

export const darkTheme = createTheme({
  palette: darkPalette,
  shadows: darkShadows,
  ...sharedThemeOptions,
  components: {
    ...baseComponents,
    MuiCssBaseline: { styleOverrides: darkCssVars },
  } as object,
});

export const lightTheme = createTheme({
  palette: lightPalette,
  shadows: lightShadows,
  ...sharedThemeOptions,
  components: {
    ...baseComponents,
    MuiCssBaseline: { styleOverrides: lightCssVars },
  } as object,
});
