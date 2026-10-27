import type React from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

export const FullScreenLoader: React.FC = () => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      bgcolor: "background.default",
    }}
  >
    <CircularProgress size={32} />
  </Box>
);
