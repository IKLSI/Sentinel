import { selectedItem } from "./helpers";

export const overlayComponents = {
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
        transition: { timeout: 140 },
        popper: {
          modifiers: [{ name: "offset", options: { offset: [0, 6] } }],
        },
      },
    },
    styleOverrides: {
      tooltip: {
        fontSize: "13px",
        fontWeight: 400,
        lineHeight: 1.4,
        fontFamily: "Inter, sans-serif",
        borderRadius: "8px",
        padding: "8px 12px",
        maxWidth: 280,
        background: "var(--s1)",
        color: "var(--text-secondary)",
        boxShadow:
          "0 0 0 1px color-mix(in srgb, var(--text) 6%, transparent), 0 8px 24px -6px rgba(0, 0, 0, 0.22), 0 2px 6px rgba(0, 0, 0, 0.08)",
      },
      arrow: {
        color: "var(--s1)",
        "&::before": {
          boxShadow: "0 3px 8px -2px rgba(0, 0, 0, 0.18)",
        },
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
        "&.Mui-selected": selectedItem,
      },
    },
  },
};
