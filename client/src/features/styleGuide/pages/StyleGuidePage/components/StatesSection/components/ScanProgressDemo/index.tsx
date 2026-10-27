import type React from "react";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { ScanProgressBar } from "@/components/ui/common/feedback/ScanProgressBar";
import {
  SAMPLE_PROJECT_ID,
  SAMPLE_PROJECT_NAME,
  SCAN_BAR_WIDTH,
  SCAN_STAGES,
  SCAN_STEP_INTERVAL_MS,
} from "@/features/styleGuide/pages/StyleGuidePage/components/StatesSection/constants";
import { PANEL_SX } from "@/helpers/cardSx";

export const ScanProgressDemo: React.FC = () => {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setStageIndex((current) => (current + 1) % SCAN_STAGES.length),
      SCAN_STEP_INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, []);

  const progress = {
    projectId: SAMPLE_PROJECT_ID,
    stage: SCAN_STAGES[stageIndex],
    step: stageIndex + 1,
    totalSteps: SCAN_STAGES.length,
  };

  return (
    <Box sx={{ ...PANEL_SX, px: "16px", py: "12px" }}>
      <Box
        sx={{
          mb: "6px",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--text)",
        }}
      >
        {SAMPLE_PROJECT_NAME}
      </Box>
      <ScanProgressBar progress={progress} width={SCAN_BAR_WIDTH} />
    </Box>
  );
};
