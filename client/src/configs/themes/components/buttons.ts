import { containedFill } from "./helpers";

export const buttonComponents = {
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: {
        textTransform: "none" as const,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        borderRadius: "var(--r)",
        fontFamily: "Inter, system-ui, sans-serif",
        transition: "all 0.15s ease",
        "&:hover": {
          backgroundColor: "transparent",
        },
      },
      contained: {
        color: "#fff",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 0 0 1px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.2)",
        "&:hover": {
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.22), inset 0 0 0 1px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.22)",
        },
        "&:active": {
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.25)",
          transform: "translateY(1px)",
        },
        "&.Mui-disabled": {
          opacity: 0.5,
          background: "var(--s3)",
          boxShadow: "none",
        },
      },
      outlined: {
        borderColor: "var(--border2)",
        color: "var(--text-secondary)",
        "&:hover": {
          borderColor: "var(--accent-border)",
          background: "var(--accent-subtle)",
          color: "var(--accent)",
        },
      },
      sizeSmall: {
        fontSize: "12px",
        padding: "6px 12px",
        borderRadius: "var(--r-sm)",
      },
      sizeMedium: {
        fontSize: "13px",
        padding: "8px 16px",
      },
      sizeLarge: {
        fontSize: "14px",
        padding: "12px 16px",
      },
    },
    variants: [
      {
        props: { variant: "contained" as const, color: "primary" as const },
        style: containedFill("--accent-fill"),
      },
      {
        props: { variant: "contained" as const, color: "secondary" as const },
        style: {
          ...containedFill("--cta"),
          "&.Mui-disabled": {
            color: "#fff",
            opacity: 0.7,
            background: "var(--cta)",
          },
        },
      },
      {
        props: { variant: "contained" as const, color: "error" as const },
        style: containedFill("--red-fill"),
      },
      {
        props: { variant: "contained" as const, color: "inherit" as const },
        style: {
          background: "var(--s3)",
          color: "var(--text-secondary)",
          boxShadow: "inset 0 0 0 1px var(--border)",
          "&:hover": {
            background: "var(--border)",
            color: "var(--text)",
            boxShadow: "inset 0 0 0 1px var(--border2)",
          },
        },
      },
    ],
  },
};
