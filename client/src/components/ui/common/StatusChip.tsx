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

const COLORS: Record<Variant, string> = {
  red: "var(--red)",
  orange: "var(--orange)",
  yellow: "var(--yellow)",
  green: "var(--green)",
  blue: "var(--accent)",
  cyan: "var(--cyan)",
  purple: "var(--purple)",
  gray: "var(--muted2)",
  sky: "var(--sky)",
  amber: "var(--yellow)",
  violet: "var(--violet)",
  emerald: "var(--emerald)",
  slate: "var(--slate)",
  rose: "var(--rose)",
  teal: "var(--teal)",
  black: "var(--text)",
};

interface StatusChipProps {
  variant?: Variant;
  startAdornment?: React.ReactNode;
  children: React.ReactNode;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  variant = "gray",
  startAdornment,
  children,
}) => {
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
        color: COLORS[variant],
        border: "none",
        borderRadius: 0,
        "& .MuiChip-label": {
          px: 0,
          display: "flex",
          alignItems: "center",
          gap: startAdornment ? "4px" : 0,
        },
      }}
    />
  );
};
