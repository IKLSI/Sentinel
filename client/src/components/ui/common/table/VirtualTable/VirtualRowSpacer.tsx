import type React from "react";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";

interface Props {
  height: number;
  columnCount: number;
}

export const VirtualRowSpacer: React.FC<Props> = ({ height, columnCount }) => {
  if (height <= 0) return null;
  return (
    <TableRow>
      <TableCell
        colSpan={columnCount}
        sx={{ height: `${height}px`, padding: 0, border: 0 }}
      />
    </TableRow>
  );
};
