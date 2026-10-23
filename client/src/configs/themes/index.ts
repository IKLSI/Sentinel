import { createTheme } from "@mui/material/styles";
import type { Shadows } from "@mui/material/styles";

const darkCssVars = `
  :root {
    color-scheme: dark;
    --bg: #111111;
    --s1: #181818;
    --s2: #1f1f1f;
    --s3: #272727;
    --border: #2a2a2a;
    --border2: #3a3a3a;
    --text: #f2f2f2;
    --text-secondary: #c4c4c4;
    --muted: #909090;
    --muted2: #a6a6a6;
    --accent: #818cf8;
    --accent2: #a5b4fc;
    --accent-fill: #5457e8;
    --accent-subtle: rgba(129, 140, 248, 0.14);
    --accent-border: rgba(129, 140, 248, 0.36);
    --blue: #818cf8;
    --green: #4ade80;
    --green-subtle: rgba(74, 222, 128, 0.14);
    --green-fill: #15803d;
    --yellow: #fbbf24;
    --yellow-subtle: rgba(251, 191, 36, 0.14);
    --orange: #fb923c;
    --orange-subtle: rgba(251, 146, 60, 0.14);
    --red: #f87171;
    --red-subtle: rgba(248, 113, 113, 0.14);
    --red-fill: #dc2626;
    --cyan: #22d3ee;
    --cyan-subtle: rgba(34, 211, 238, 0.14);
    --purple: #c084fc;
    --purple-subtle: rgba(192, 132, 252, 0.14);
    --sh-1: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 1px 2px rgba(0, 0, 0, 0.35);
    --sh-2: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 12px rgba(0, 0, 0, 0.45);
    --sh-3: 0 16px 40px rgba(0, 0, 0, 0.55);
    --r-xs: 4px;
    --r-sm: 6px;
    --r: 8px;
    --r-md: 12px;
    --r-lg: 16px;
    --r-xl: 20px;
    --font-ui: 'Inter', system-ui, -apple-system, sans-serif;
    --font-mono: 'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace;
  }
  body { scrollbar-width: thin; }
`;

const lightCssVars = `
  :root {
    color-scheme: light;
    --bg: #f0f2f8;
    --s1: #ffffff;
    --s2: #f5f7fc;
    --s3: #eaedfa;
    --border: #dde3f2;
    --border2: #c8d2eb;
    --text: #0e1220;
    --text-secondary: #3a4768;
    --muted: #8898bb;
    --muted2: #5c6f90;
    --accent: #4f46e5;
    --accent2: #3730a3;
    --accent-fill: #4f46e5;
    --accent-subtle: rgba(79, 70, 229, 0.08);
    --accent-border: rgba(79, 70, 229, 0.25);
    --blue: #4f46e5;
    --green: #16a34a;
    --green-subtle: rgba(22, 163, 74, 0.08);
    --green-fill: #15803d;
    --yellow: #d97706;
    --yellow-subtle: rgba(217, 119, 6, 0.08);
    --orange: #ea580c;
    --orange-subtle: rgba(234, 88, 12, 0.08);
    --red: #dc2626;
    --red-subtle: rgba(220, 38, 38, 0.08);
    --red-fill: #dc2626;
    --cyan: #0891b2;
    --cyan-subtle: rgba(8, 145, 178, 0.08);
    --purple: #9333ea;
    --purple-subtle: rgba(147, 51, 234, 0.08);
    --sh-1: 0 1px 2px rgba(16, 24, 40, 0.05);
    --sh-2: 0 6px 16px rgba(16, 24, 40, 0.09);
    --sh-3: 0 20px 48px rgba(16, 24, 40, 0.13);
    --r-xs: 4px;
    --r-sm: 6px;
    --r: 8px;
    --r-md: 12px;
    --r-lg: 16px;
    --r-xl: 20px;
    --font-ui: 'Inter', system-ui, -apple-system, sans-serif;
    --font-mono: 'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace;
  }
  body { scrollbar-width: thin; }
`;

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

const baseComponents = {
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
        style: {
          background: "var(--accent-fill)",
          "&:hover": {
            background: "color-mix(in srgb, var(--accent-fill) 88%, white)",
          },
        },
      },
      {
        props: { variant: "contained" as const, color: "secondary" as const },
        style: {
          background: "var(--cta)",
          "&:hover": {
            background: "color-mix(in srgb, var(--cta) 88%, white)",
          },
          "&.Mui-disabled": {
            color: "#fff",
            opacity: 0.7,
            background: "var(--cta)",
          },
        },
      },
      {
        props: { variant: "contained" as const, color: "error" as const },
        style: {
          background: "var(--red-fill)",
          "&:hover": {
            background: "color-mix(in srgb, var(--red-fill) 88%, white)",
          },
        },
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
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      root: {
        "& .MuiBackdrop-root": {
          backdropFilter: "blur(4px)",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
        },
      },
      paper: {
        borderRadius: "var(--r-lg)",
        background: "var(--s1)",
        border: "1px solid var(--border)",
        boxShadow: "var(--sh-3)",
      },
    },
  },
  MuiDialogTitle: {
    styleOverrides: {
      root: {
        fontWeight: 700,
        letterSpacing: "-0.02em",
        fontSize: "15px",
      },
    },
  },
  MuiTooltip: {
    defaultProps: {
      enterDelay: 250,
      enterNextDelay: 250,
      leaveDelay: 0,
      slotProps: {
        transition: { timeout: 120 },
      },
    },
    styleOverrides: {
      tooltip: {
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.01em",
        fontFamily: "Inter, sans-serif",
        borderRadius: "var(--r-sm)",
        padding: "6px 10px",
        background: "var(--s2)",
        color: "var(--text-secondary)",
        border: "1px solid var(--border)",
        boxShadow: "var(--sh-2)",
      },
      arrow: {
        color: "var(--s2)",
        "&::before": {
          border: "1px solid var(--border)",
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        fontFamily: "JetBrains Mono, monospace",
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.04em",
        height: "20px",
        borderRadius: "var(--r-sm)",
      },
      label: {
        padding: "0 6px",
      },
    },
  },
  MuiCircularProgress: {
    defaultProps: {
      color: "primary",
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: {
        borderColor: "var(--border)",
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: "var(--r-sm)",
        transition: "all 0.12s ease",
        "&:hover": { background: "var(--s2)" },
        "&.Mui-selected": {
          background: "var(--accent-subtle)",
          color: "var(--accent)",
          "&:hover": { background: "var(--accent-subtle)" },
        },
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        background: "var(--s2)",
        borderRadius: "var(--r)",
        fontSize: "13px",
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--border)",
          transition: "border-color 0.15s",
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--border2)",
        },
        "&.Mui-focused": {
          boxShadow: "0 0 0 3px var(--accent-subtle)",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--accent)",
          borderWidth: "1px",
        },
        "&.Mui-error .MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--red)",
        },
        "&.Mui-disabled": { opacity: 0.55 },
      },
      input: {
        color: "var(--text)",
        "&::placeholder": { color: "var(--muted)", opacity: 1 },
        "&:focus": { boxShadow: "none" },
      },
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: {
        color: "var(--muted2)",
        fontSize: "13px",
        "&.Mui-focused": { color: "var(--accent)" },
        "&.Mui-error": { color: "var(--red)" },
      },
    },
  },
  MuiFormHelperText: {
    styleOverrides: {
      root: {
        color: "var(--muted2)",
        "&.Mui-error": { color: "var(--red)" },
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        color: "var(--muted2)",
        borderRadius: "var(--r-sm)",
        transition: "background 0.12s, color 0.12s",
        "&:hover": { background: "var(--s3)", color: "var(--text)" },
      },
    },
  },
  MuiSkeleton: {
    styleOverrides: {
      root: {
        backgroundColor: "var(--s3)",
        borderRadius: "var(--r-sm)",
      },
    },
  },
  MuiSwitch: {
    styleOverrides: {
      switchBase: {
        color: "var(--muted2)",
        "&.Mui-checked": { color: "var(--accent)" },
        "&.Mui-checked + .MuiSwitch-track": {
          backgroundColor: "var(--accent)",
          opacity: 0.5,
        },
      },
      track: { backgroundColor: "var(--border2)", opacity: 1 },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        fontSize: "13px",
        borderRadius: "var(--r)",
        border: "1px solid",
      },
      standardError: {
        background: "var(--red-subtle)",
        borderColor: "color-mix(in srgb, var(--red) 32%, transparent)",
        color: "var(--red)",
      },
      standardSuccess: {
        background: "var(--green-subtle)",
        borderColor: "color-mix(in srgb, var(--green) 32%, transparent)",
        color: "var(--green)",
      },
      standardWarning: {
        background: "var(--yellow-subtle)",
        borderColor: "color-mix(in srgb, var(--yellow) 32%, transparent)",
        color: "var(--yellow)",
      },
      standardInfo: {
        background: "var(--accent-subtle)",
        borderColor: "var(--accent-border)",
        color: "var(--accent)",
      },
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: {
        fontFamily: "JetBrains Mono, monospace",
        fontWeight: 700,
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        background: "var(--s2)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
        boxShadow: "var(--sh-3)",
        backgroundImage: "none",
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        fontSize: "13px",
        borderRadius: "var(--r-sm)",
        margin: "1px 4px",
        transition: "background 0.1s",
        color: "var(--text-secondary)",
        "&:hover": { background: "var(--s3)", color: "var(--text)" },
        "&.Mui-selected": {
          background: "var(--accent-subtle)",
          color: "var(--accent)",
          "&:hover": { background: "var(--accent-subtle)" },
        },
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        border: "none",
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundImage: "none",
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: "var(--r-xs)",
        height: "4px",
      },
    },
  },
};

export const darkTheme = createTheme({
  palette: {
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
  },
  shadows: buildShadows(darkShadowSteps),
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    ...baseComponents,
    MuiCssBaseline: { styleOverrides: darkCssVars },
  } as object,
});

export const lightTheme = createTheme({
  palette: {
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
  },
  shadows: buildShadows(lightShadowSteps),
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    ...baseComponents,
    MuiCssBaseline: { styleOverrides: lightCssVars },
  } as object,
});
