import type React from "react";
import Box from "@mui/material/Box";

interface Props {
  height: number;
  columnCount: number;
}

export const VirtualRowSpacer: React.FC<Props> = ({ height, columnCount }) => {
  if (height <= 0) return null;
  return (
    <Box component="tr">
      <Box
        component="td"
        colSpan={columnCount}
        sx={{ height: `${height}px`, padding: 0, border: 0 }}
      />
    </Box>
  );
};
