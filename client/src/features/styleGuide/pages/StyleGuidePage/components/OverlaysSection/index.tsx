import type React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { TruncatedText } from "@/components/ui/common/TruncatedText";
import { useT } from "@/contexts/I18nContext";
import { LabelledRow } from "@/features/styleGuide/pages/StyleGuidePage/components/LabelledRow";
import { ModalTriggers } from "@/features/styleGuide/pages/StyleGuidePage/components/OverlaysSection/components/ModalTriggers";
import { ToastTriggers } from "@/features/styleGuide/pages/StyleGuidePage/components/OverlaysSection/components/ToastTriggers";
import {
  TOOLTIP_PLACEMENTS,
  TRUNCATED_SAMPLE,
} from "@/features/styleGuide/pages/StyleGuidePage/components/OverlaysSection/constants";
import { Specimen } from "@/features/styleGuide/pages/StyleGuidePage/components/Specimen";

const TRUNCATION_WIDTH = 200;

export const OverlaysSection: React.FC = () => {
  const t = useT();

  return (
    <>
      <Specimen
        title={t("style_guide.overlays.tooltip")}
        note={t("style_guide.overlays.tooltip_note")}
        source="components/ui/common/AppTooltip.tsx"
      >
        <LabelledRow label={t("style_guide.overlays.placements")}>
          {TOOLTIP_PLACEMENTS.map(({ placement, labelKey }) => (
            <AppTooltip
              key={placement}
              title={t("projects.action.scan")}
              placement={placement}
            >
              <Button variant="outlined" size="small">
                {t(labelKey)}
              </Button>
            </AppTooltip>
          ))}
        </LabelledRow>
        <LabelledRow label={t("style_guide.overlays.truncated")}>
          <Box sx={{ width: TRUNCATION_WIDTH }}>
            <TruncatedText text={TRUNCATED_SAMPLE} fontSize="13px" strong />
          </Box>
        </LabelledRow>
      </Specimen>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "repeat(2, minmax(0, 1fr))",
          },
          gap: "20px",
        }}
      >
        <Specimen
          title={t("style_guide.overlays.modals")}
          note={t("style_guide.overlays.modals_note")}
        >
          <ModalTriggers />
        </Specimen>
        <Specimen
          title={t("style_guide.overlays.toasts")}
          note={t("style_guide.overlays.toasts_note")}
        >
          <ToastTriggers />
        </Specimen>
      </Box>
    </>
  );
};
