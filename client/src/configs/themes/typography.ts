import type { CSSProperties } from "react";

declare module "@mui/material/styles" {
  interface TypographyVariants {
    label: CSSProperties;
    cardTitle: CSSProperties;
    monoLabel: CSSProperties;
    monoCaption: CSSProperties;
  }

  interface TypographyVariantsOptions {
    label?: CSSProperties;
    cardTitle?: CSSProperties;
    monoLabel?: CSSProperties;
    monoCaption?: CSSProperties;
  }
}

const UPPERCASE = { textTransform: "uppercase" } as const;

export const typographyVariants = {
  label: {
    ...UPPERCASE,
    fontSize: "10.5px",
    fontWeight: 700,
    letterSpacing: "0.07em",
  },
  cardTitle: {
    ...UPPERCASE,
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.08em",
  },
  monoLabel: {
    ...UPPERCASE,
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.1em",
  },
  monoCaption: {
    ...UPPERCASE,
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    letterSpacing: "0.1em",
  },
};
