import { alertTone, selectedItem } from "./helpers";

export const surfaceComponents = {
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        fontFamily: "var(--font-mono)",
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
        "&.Mui-selected": selectedItem,
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
    defaultProps: { animation: "wave" },
    styleOverrides: {
      root: {
        backgroundColor: "color-mix(in srgb, var(--s3) 75%, var(--s1))",
        borderRadius: "var(--r-sm)",
      },
      wave: {
        "&::after": {
          background:
            "linear-gradient(90deg, transparent, color-mix(in srgb, var(--text) 7%, transparent), transparent)",
        },
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        fontSize: "13px",
        borderRadius: "var(--r)",
        border: "1px solid",
      },
      standardError: alertTone("red"),
      standardSuccess: alertTone("green"),
      standardWarning: alertTone("yellow"),
      standardInfo: alertTone("accent", "var(--accent-border)"),
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: {
        fontFamily: "var(--font-mono)",
        fontWeight: 700,
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
