import type React from "react";
import Box from "@mui/material/Box";

export type CellAlign = "left" | "center" | "right";
export type SortDirection = "asc" | "desc";

const RAIL_WIDTH = "3px";

export const TD: React.FC<{
  children: React.ReactNode;
  mono?: boolean;
  muted?: boolean;
  align?: CellAlign;
}> = ({ children, mono, muted, align = "left" }) => (
  <Box
    component="td"
    sx={{
      padding: "11px 16px",
      borderBottom: "1px solid var(--border)",
      fontSize: "12px",
      fontFamily: mono ? "var(--font-mono)" : "inherit",
      color: muted ? "var(--muted2)" : "var(--text)",
      verticalAlign: "middle",
      textAlign: align,
    }}
  >
    {children}
  </Box>
);

export const TR: React.FC<{
  children: React.ReactNode;
  accent?: string;
  index?: number;
}> = ({ children, accent, index }) => (
  <Box
    component="tr"
    data-index={index}
    sx={{
      "&:last-child td": { borderBottom: "none" },
      "&:hover td": { background: "var(--s2)" },
      ...(accent
        ? {
            "& > td:first-of-type": {
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: RAIL_WIDTH,
                background: accent,
              },
            },
          }
        : {}),
    }}
  >
    {children}
  </Box>
);
