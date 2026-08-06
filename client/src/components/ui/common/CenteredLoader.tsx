import type React from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

const ICON_SIZE = 20;

interface Props {
  fullHeight?: boolean;
}

export const CenteredLoader: React.FC<Props> = ({ fullHeight }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      ...(fullHeight ? { height: "100%" } : { flex: 1 }),
    }}
  >
    <CircularProgress size={ICON_SIZE} />
  </Box>
);
