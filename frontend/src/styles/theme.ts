import { createTheme } from '@mui/material/styles'

const baseComponents = {
  MuiCssBaseline: {
    styleOverrides: {
      body: { scrollbarWidth: 'thin' },
    },
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: {
        textTransform: 'none' as const,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        borderRadius: '8px',
        fontFamily: 'Inter, system-ui, sans-serif',
        transition: 'all 0.15s ease',
      },
      contained: {
        background: 'linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 80%, #818cf8) 100%)',
        boxShadow: '0 2px 12px rgba(99,102,241,0.25)',
        '&:hover': {
          background: 'linear-gradient(135deg, var(--accent2) 0%, var(--accent) 100%)',
          boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
          transform: 'translateY(-1px)',
        },
        '&:active': { transform: 'translateY(0)' },
        '&.Mui-disabled': {
          opacity: 0.5,
          background: 'var(--s3)',
          boxShadow: 'none',
        },
      },
      outlined: {
        borderColor: 'var(--border2)',
        color: 'var(--text-secondary)',
        '&:hover': {
          borderColor: 'var(--accent-border)',
          background: 'var(--accent-subtle)',
          color: 'var(--accent)',
        },
      },
      sizeSmall: {
        fontSize: '12px',
        padding: '6px 12px',
        borderRadius: '7px',
      },
      sizeMedium: {
        fontSize: '13px',
        padding: '8px 16px',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      root: {
        '& .MuiBackdrop-root': {
          backdropFilter: 'blur(4px)',
          backgroundColor: 'rgba(0,0,0,0.5)',
        },
      },
      paper: {
        borderRadius: '14px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
      },
    },
  },
  MuiDialogTitle: {
    styleOverrides: {
      root: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
        fontSize: '15px',
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        fontSize: '11px',
        fontWeight: 500,
        fontFamily: 'Inter, sans-serif',
        borderRadius: '6px',
        padding: '5px 10px',
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        height: '20px',
        borderRadius: '5px',
      },
      label: {
        padding: '0 6px',
      },
    },
  },
  MuiCircularProgress: {
    defaultProps: {
      color: 'primary',
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: {
        borderColor: 'var(--border)',
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: '7px',
        transition: 'all 0.12s ease',
      },
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: {
        fontFamily: 'JetBrains Mono, monospace',
        fontWeight: 700,
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        fontSize: '13px',
        borderRadius: '6px',
        margin: '1px 4px',
        transition: 'background 0.1s',
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        border: 'none',
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: '4px',
        height: '4px',
      },
    },
  },
}

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#6366f1', dark: '#4f52cf' },
    error: { main: '#ef4444' },
    success: { main: '#22c55e' },
    warning: { main: '#f59e0b' },
    background: { default: '#080c14', paper: '#0d1120' },
    text: { primary: '#e6eaf6', secondary: '#a0aec9' },
    divider: '#1e2a42',
    action: {
      hover: 'rgba(255,255,255,0.04)',
      selected: 'rgba(99,102,241,0.12)',
    },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: baseComponents as object,
})

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#4f46e5', dark: '#3730a3' },
    error: { main: '#dc2626' },
    success: { main: '#16a34a' },
    warning: { main: '#d97706' },
    background: { default: '#f0f2f8', paper: '#ffffff' },
    text: { primary: '#0e1220', secondary: '#4d5e82' },
    divider: '#dde3f2',
    action: {
      hover: 'rgba(0,0,0,0.03)',
      selected: 'rgba(79,70,229,0.08)',
    },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: baseComponents as object,
})
