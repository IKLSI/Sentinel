import type React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useT } from "@/contexts/I18nContext";
import {
  SAMPLE_PROJECT_NAME,
  TOAST_SAMPLES,
} from "@/features/styleGuide/pages/StyleGuidePage/components/OverlaysSection/constants";
import { useToast } from "@/hooks/useToast";

export const ToastTriggers: React.FC = () => {
  const t = useT();
  const { showToast } = useToast();

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
      {TOAST_SAMPLES.map(({ severity, labelKey, messageKey }) => (
        <Button
          key={severity}
          variant="outlined"
          size="small"
          onClick={() =>
            showToast(t(messageKey, { name: SAMPLE_PROJECT_NAME }), severity)
          }
        >
          {t(labelKey)}
        </Button>
      ))}
    </Box>
  );
};
