import type React from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

const ICON_SIZE = 20;

export const CenteredLoader: React.FC = () => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
    }}
  >
    <CircularProgress size={ICON_SIZE} />
  </Box>
);
