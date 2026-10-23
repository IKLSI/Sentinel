import type React from "react";
import Box from "@mui/material/Box";
import { useReadingProgress } from "@/hooks/useReadingProgress";

export const ReadingProgressBar: React.FC = () => {
  const { progress } = useReadingProgress(0);

  return (
    <Box
      sx={{
        position: "absolute",
        left: 0,
        bottom: "-1px",
        height: "2px",
        width: `${progress}%`,
        background:
          "linear-gradient(90deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 55%, white) 100%)",
        transition: "width 0.08s linear",
      }}
    />
  );
};
