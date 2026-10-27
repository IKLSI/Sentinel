import { createTheme } from "@mui/material/styles";
import type { ThemeOptions } from "@mui/material/styles";
import { baseComponents } from "./components";
import { darkCssVars, lightCssVars } from "./cssVars";
import { darkPalette, lightPalette } from "./palettes";
import { darkShadows, lightShadows } from "./shadows";
import { typographyVariants } from "./typography";

const sharedThemeOptions: Pick<ThemeOptions, "shape" | "typography"> = {
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "var(--font-ui)",
    button: { textTransform: "none", fontWeight: 600 },
    ...typographyVariants,
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
