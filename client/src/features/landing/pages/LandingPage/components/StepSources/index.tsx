import type React from "react";
import Box from "@mui/material/Box";
import {
  SHOWCASE,
  STEP_CHIP_SX,
  STEP_SOURCES,
} from "@/features/landing/constants";

export const StepSources: React.FC = () => (
  <>
    <Box
      sx={{
        background: "var(--ink)",
        color: "var(--indigo-100)",
        font: "400 12.5px var(--font-code)",
        px: "14px",
        py: "8px",
        borderRadius: "10px",
      }}
    >
      {SHOWCASE.manifest}
    </Box>
    <Box
      aria-hidden
      sx={{
        width: "70%",
        height: 18,
        border: "1.5px dashed var(--indigo-300)",
        borderBottom: 0,
        borderRadius: "10px 10px 0 0",
        boxSizing: "border-box",
      }}
    />
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "6px",
        width: "100%",
      }}
    >
      {STEP_SOURCES.map((source) => (
        <Box
          key={source}
          sx={{
            ...STEP_CHIP_SX,
            borderRadius: "10px",
            p: "7px 8px",
            fontSize: "12.5px",
            fontWeight: 500,
          }}
        >
          {source}
        </Box>
      ))}
    </Box>
  </>
);
