import type React from "react";
import Box from "@mui/material/Box";

export type CellAlign = "left" | "center" | "right";

export const TH: React.FC<{
  children: React.ReactNode;
  width?: string;
  align?: CellAlign;
}> = ({ children, width, align = "left" }) => (
  <Box
    component="th"
    sx={{
      fontFamily: "var(--font-mono)",
      fontSize: "10px",
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "var(--muted)",
      textAlign: align,
      padding: "10px 16px",
      whiteSpace: "nowrap",
      width: width ?? "auto",
      position: "sticky",
      top: 0,
      zIndex: 1,
    }}
  >
    {children}
  </Box>
);

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
      fontSize: "13px",
      fontFamily: mono ? "var(--font-mono)" : "inherit",
      color: muted ? "var(--muted2)" : "var(--text)",
      verticalAlign: "middle",
      textAlign: align,
    }}
  >
    {children}
  </Box>
);

export const TR: React.FC<{ children: React.ReactNode; accent?: string }> = ({
  children,
}) => (
  <Box
    component="tr"
    sx={{
      "&:last-child td": { borderBottom: "none" },
    }}
  >
    {children}
  </Box>
);
