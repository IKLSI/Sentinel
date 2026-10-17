import type React from "react";
import { version } from "@/../package.json";
import Box from "@mui/material/Box";

export const VersionBadge: React.FC = () => {
  return (
    <Box
      sx={{
        position: "fixed",
        bottom: "10px",
        right: "14px",
        fontSize: "10px",
        color: "var(--muted)",
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.04em",
        userSelect: "none",
        pointerEvents: "none",
      }}
    >
      v{version}
    </Box>
  );
};
