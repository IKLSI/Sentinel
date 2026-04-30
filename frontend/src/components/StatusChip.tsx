import React from "react";
import Chip from "@mui/material/Chip";

type Variant =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "cyan"
  | "purple"
  | "gray"
  | "sky"
  | "amber"
  | "violet"
  | "emerald"
  | "slate"
  | "rose"
  | "teal"
  | "black";

const colorMap: Record<Variant, { bg: string; color: string; border: string }> =
  {
    red: {
      bg: "rgba(239,68,68,0.12)",
      color: "#ef4444",
      border: "rgba(239,68,68,0.25)",
    },
    orange: {
      bg: "var(--orange-subtle)",
      color: "var(--orange)",
      border: "rgba(249,115,22,0.28)",
    },
    yellow: {
      bg: "rgba(234,179,8,0.10)",
      color: "var(--yellow)",
      border: "rgba(234,179,8,0.25)",
    },
    green: {
      bg: "var(--green-subtle)",
      color: "var(--green)",
      border: "rgba(34,197,94,0.28)",
    },
    blue: {
      bg: "var(--accent-subtle)",
      color: "var(--accent)",
      border: "var(--accent-border)",
    },
    cyan: {
      bg: "rgba(6,182,212,0.12)",
      color: "var(--cyan)",
      border: "rgba(6,182,212,0.25)",
    },
    purple: {
      bg: "var(--purple-subtle)",
      color: "var(--purple)",
      border: "rgba(168,85,247,0.28)",
    },
    gray: {
      bg: "rgba(116,136,170,0.10)",
      color: "var(--muted2)",
      border: "rgba(116,136,170,0.22)",
    },
    sky: {
      bg: "rgba(56,189,248,0.12)",
      color: "#38bdf8",
      border: "rgba(56,189,248,0.25)",
    },
    amber: {
      bg: "rgba(245,158,11,0.12)",
      color: "#f59e0b",
      border: "rgba(245,158,11,0.25)",
    },
    violet: {
      bg: "rgba(139,92,246,0.12)",
      color: "#8b5cf6",
      border: "rgba(139,92,246,0.25)",
    },
    emerald: {
      bg: "rgba(16,185,129,0.12)",
      color: "#10b981",
      border: "rgba(16,185,129,0.25)",
    },
    slate: {
      bg: "rgba(100,116,139,0.12)",
      color: "#64748b",
      border: "rgba(100,116,139,0.2)",
    },
    rose: {
      bg: "rgba(244,63,94,0.12)",
      color: "#f43f5e",
      border: "rgba(244,63,94,0.25)",
    },
    teal: {
      bg: "rgba(20,184,166,0.12)",
      color: "#14b8a6",
      border: "rgba(20,184,166,0.25)",
    },
    black: {
      bg: "rgba(0,0,0,0.08)",
      color: "var(--text)",
      border: "rgba(0,0,0,0.15)",
    },
  };

interface StatusChipProps {
  variant?: Variant;
  pill?: boolean;
  startAdornment?: React.ReactNode;
  children: React.ReactNode;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  variant = "gray",
  pill: _pill,
  startAdornment,
  children,
}) => {
  const { color } = colorMap[variant];
  return (
    <Chip
      label={
        startAdornment ? (
          <React.Fragment>
            {startAdornment}
            {children}
          </React.Fragment>
        ) : (
          children
        )
      }
      size="small"
      sx={{
        height: "18px",
        fontSize: "10px",
        fontWeight: 700,
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.04em",
        backgroundColor: "transparent",
        color,
        border: "none",
        borderRadius: 0,
        "& .MuiChip-label": {
          px: "4px",
          display: "flex",
          alignItems: "center",
          gap: startAdornment ? "4px" : 0,
        },
      }}
    />
  );
};
