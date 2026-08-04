import { createTheme } from "@mui/material/styles";

const darkCssVars = `
  :root {
    color-scheme: dark;
    --bg: #080c14;
    --s1: #0d1120;
    --s2: #121829;
    --s3: #192036;
    --border: #1e2a42;
    --border2: #263352;
    --text: #e6eaf6;
    --text-secondary: #a0aec9;
    --muted: #4d5e82;
    --muted2: #7488aa;
    --accent: #6366f1;
    --accent2: #4f52cf;
    --accent-subtle: rgba(99, 102, 241, 0.10);
    --accent-border: rgba(99, 102, 241, 0.30);
    --blue: #6366f1;
    --green: #22c55e;
    --green-subtle: rgba(34, 197, 94, 0.10);
    --yellow: #f59e0b;
    --yellow-subtle: rgba(245, 158, 11, 0.10);
    --orange: #f97316;
    --orange-subtle: rgba(249, 115, 22, 0.10);
    --red: #ef4444;
    --red-subtle: rgba(239, 68, 68, 0.10);
    --cyan: #06b6d4;
    --cyan-subtle: rgba(6, 182, 212, 0.10);
    --purple: #a855f7;
    --purple-subtle: rgba(168, 85, 247, 0.10);
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
    --accent-subtle: rgba(79, 70, 229, 0.08);
    --accent-border: rgba(79, 70, 229, 0.25);
    --blue: #4f46e5;
    --green: #16a34a;
    --green-subtle: rgba(22, 163, 74, 0.08);
    --yellow: #d97706;
    --yellow-subtle: rgba(217, 119, 6, 0.08);
    --orange: #ea580c;
    --orange-subtle: rgba(234, 88, 12, 0.08);
    --red: #dc2626;
    --red-subtle: rgba(220, 38, 38, 0.08);
    --cyan: #0891b2;
    --cyan-subtle: rgba(8, 145, 178, 0.08);
    --purple: #9333ea;
    --purple-subtle: rgba(147, 51, 234, 0.08);
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
        boxShadow: "none",
        "&:hover": { boxShadow: "none" },
        "&:active": { boxShadow: "none" },
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
    },
    variants: [
      {
        props: { variant: "contained" as const, color: "primary" as const },
        style: {
          background:
            "linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 92%, white) 100%)",
          "&:hover": {
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--accent) 85%, black) 0%, var(--accent) 100%)",
          },
        },
      },
      {
        props: { variant: "contained" as const, color: "secondary" as const },
        style: {
          background:
            "linear-gradient(135deg, var(--cta) 0%, color-mix(in srgb, var(--cta) 92%, white) 100%)",
          "&:hover": {
            background:
              "linear-gradient(135deg, var(--cta-2) 0%, var(--cta) 100%)",
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
          background:
            "linear-gradient(135deg, var(--red) 0%, color-mix(in srgb, var(--red) 92%, white) 100%)",
          "&:hover": {
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--red) 85%, black) 0%, var(--red) 100%)",
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
          backgroundColor: "rgba(0,0,0,0.5)",
        },
      },
      paper: {
        borderRadius: "var(--r-lg)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
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
    styleOverrides: {
      tooltip: {
        fontSize: "11px",
        fontWeight: 500,
        fontFamily: "Inter, sans-serif",
        borderRadius: "var(--r-sm)",
        padding: "5px 10px",
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
  MuiMenuItem: {
    styleOverrides: {
      root: {
        fontSize: "13px",
        borderRadius: "var(--r-sm)",
        margin: "1px 4px",
        transition: "background 0.1s",
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
    primary: { main: "#6366f1", dark: "#4f52cf" },
    secondary: { main: "#7c6fcd", dark: "#6a5eb8" },
    error: { main: "#ef4444" },
    success: { main: "#22c55e" },
    warning: { main: "#f59e0b" },
    background: { default: "#080c14", paper: "#0d1120" },
    text: { primary: "#e6eaf6", secondary: "#a0aec9" },
    divider: "#1e2a42",
    action: {
      hover: "rgba(255,255,255,0.04)",
      selected: "rgba(99, 102, 241, 0.12)",
    },
  },
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
