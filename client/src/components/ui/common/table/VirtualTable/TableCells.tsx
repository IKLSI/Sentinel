import type React from "react";
import { createContext, useContext } from "react";
import Box from "@mui/material/Box";

export type CellAlign = "left" | "center" | "right";
export type SortDirection = "asc" | "desc";

export const VirtualRowMeasureContext = createContext<
  ((element: Element | null) => void) | null
>(null);

export const TD: React.FC<{
  children: React.ReactNode;
  mono?: boolean;
  muted?: boolean;
  align?: CellAlign;
}> = ({ children, mono, muted, align = "left" }) => (
  <Box
    component="td"
    sx={{
      padding: "9px 16px",
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
  index?: number;
}> = ({ children, index }) => {
  const measureRow = useContext(VirtualRowMeasureContext);

  return (
    <Box
      component="tr"
      data-index={index}
      ref={index === undefined ? undefined : (measureRow ?? undefined)}
      sx={{
        "&:last-child td": { borderBottom: "none" },
        "&:hover td": { background: "var(--s2)" },
      }}
    >
      {children}
    </Box>
  );
};
