import type React from "react";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { LoadErrorState } from "@/components/ui/common/feedback/LoadErrorState";
import { RETRY_DELAY_MS } from "@/features/styleGuide/pages/StyleGuidePage/components/StatesSection/constants";
import { PANEL_SX } from "@/helpers/cardSx";

export const RetryDemo: React.FC = () => {
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!retrying) return;
    const timer = window.setTimeout(() => setRetrying(false), RETRY_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [retrying]);

  return (
    <Box sx={{ ...PANEL_SX, flex: 1, display: "flex" }}>
      <LoadErrorState onRetry={() => setRetrying(true)} retrying={retrying} />
    </Box>
  );
};
