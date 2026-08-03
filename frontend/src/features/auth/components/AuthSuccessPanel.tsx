import type React from "react";
import Box from "@mui/material/Box";

interface AuthModalSuccessProps {
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
  actionClassName?: string;
  actionStyle?: React.CSSProperties;
  children?: React.ReactNode;
}

export const AuthModalSuccess: React.FC<AuthModalSuccessProps> = ({
  title,
  subtitle,
  actionLabel,
  onAction,
  actionClassName = "lp-submit",
  actionStyle = { animation: "none", opacity: 1 },
  children,
}) => (
  <Box sx={{ textAlign: "center", py: "8px" }}>
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: "var(--r-md)",
        background: "var(--accent-subtle)",
        border: "1px solid var(--accent-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        mx: "auto",
        mb: "14px",
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4 10l4 4 8-8"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
    <Box
      sx={{
        fontSize: "14px",
        fontWeight: 700,
        color: "var(--text)",
        letterSpacing: "-0.02em",
        mb: "5px",
      }}
    >
      {title}
    </Box>
    <Box
      sx={{
        fontSize: "12.5px",
        color: "var(--muted2)",
        lineHeight: 1.65,
        mb: "18px",
      }}
    >
      {subtitle}
    </Box>
    <button
      type="button"
      className={actionClassName}
      onClick={onAction}
      style={actionStyle}
    >
      {actionLabel}
    </button>
    {children}
  </Box>
);

interface AuthPageSuccessProps {
  title: string;
  subtitle: React.ReactNode;
}

export const AuthPageSuccess: React.FC<AuthPageSuccessProps> = ({
  title,
  subtitle,
}) => (
  <Box className="aip-success">
    <Box className="aip-success-icon">
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 14l6 6 10-10"
          style={{ stroke: "var(--auth-indigo-500)" }}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
    <Box component="p" className="aip-success-title">
      {title}
    </Box>
    <Box component="p" className="aip-success-sub">
      {subtitle}
    </Box>
  </Box>
);
