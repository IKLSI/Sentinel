import type React from "react";
import { createContext, useContext } from "react";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";

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
  <TableCell
    align={align}
    sx={{
      fontSize: "12px",
      fontFamily: mono ? "var(--font-mono)" : "inherit",
      color: muted ? "var(--muted2)" : "var(--text)",
    }}
  >
    {children}
  </TableCell>
);

export const TR: React.FC<{
  children: React.ReactNode;
  index?: number;
}> = ({ children, index }) => {
  const measureRow = useContext(VirtualRowMeasureContext);

  return (
    <TableRow
      hover
      data-index={index}
      ref={index === undefined ? undefined : (measureRow ?? undefined)}
    >
      {children}
    </TableRow>
  );
};
