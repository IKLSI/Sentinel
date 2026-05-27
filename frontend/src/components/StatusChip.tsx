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
      bg: "color-mix(in srgb, var(--red) 12%, transparent)",
      color: "var(--red)",
      border: "color-mix(in srgb, var(--red) 25%, transparent)",
    },
    orange: {
      bg: "var(--orange-subtle)",
      color: "var(--orange)",
      border: "color-mix(in srgb, var(--orange) 28%, transparent)",
    },
    yellow: {
      bg: "var(--yellow-subtle)",
      color: "var(--yellow)",
      border: "color-mix(in srgb, var(--yellow) 25%, transparent)",
    },
    green: {
      bg: "var(--green-subtle)",
      color: "var(--green)",
      border: "color-mix(in srgb, var(--green) 28%, transparent)",
    },
    blue: {
      bg: "var(--accent-subtle)",
      color: "var(--accent)",
      border: "var(--accent-border)",
    },
    cyan: {
      bg: "color-mix(in srgb, var(--cyan) 12%, transparent)",
      color: "var(--cyan)",
      border: "color-mix(in srgb, var(--cyan) 25%, transparent)",
    },
    purple: {
      bg: "var(--purple-subtle)",
      color: "var(--purple)",
      border: "color-mix(in srgb, var(--purple) 28%, transparent)",
    },
    gray: {
      bg: "color-mix(in srgb, var(--muted2) 10%, transparent)",
      color: "var(--muted2)",
      border: "color-mix(in srgb, var(--muted2) 22%, transparent)",
    },
    sky: {
      bg: "var(--sky-subtle)",
      color: "var(--sky)",
      border: "var(--sky-border)",
    },
    amber: {
      bg: "color-mix(in srgb, var(--yellow) 12%, transparent)",
      color: "var(--yellow)",
      border: "color-mix(in srgb, var(--yellow) 25%, transparent)",
    },
    violet: {
      bg: "var(--violet-subtle)",
      color: "var(--violet)",
      border: "var(--violet-border)",
    },
    emerald: {
      bg: "var(--emerald-subtle)",
      color: "var(--emerald)",
      border: "var(--emerald-border)",
    },
    slate: {
      bg: "var(--slate-subtle)",
      color: "var(--slate)",
      border: "var(--slate-border)",
    },
    rose: {
      bg: "var(--rose-subtle)",
      color: "var(--rose)",
      border: "var(--rose-border)",
    },
    teal: {
      bg: "var(--teal-subtle)",
      color: "var(--teal)",
      border: "var(--teal-border)",
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
