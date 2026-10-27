import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import {
  DEMO_CANVAS_HEIGHT,
  DEMO_CANVAS_WIDTH,
  DEMO_FRAME_SX,
  DEMO_MODES,
  DEMO_POSTER_SIZES,
  DEMO_POSTER_SRC,
  DEMO_POSTER_SRCSET,
  DEMO_SECTION_SX,
  type DemoMode,
} from "@/features/landing/demo/constants";
import { DemoFullscreenButton } from "@/features/landing/pages/LandingPage/components/DemoLauncher/components/DemoFullscreenButton";

const ACTIVATION_KEYS = ["Enter", " "];

interface Props {
  onActivate?: (mode: DemoMode) => void;
}

export const DemoPlaceholder: React.FC<Props> = ({ onActivate }) => {
  const t = useT();
  const activateInline = () => onActivate?.(DEMO_MODES.inline);

  return (
    <Box
      component="section"
      aria-label={t("landing.demo.label")}
      sx={DEMO_SECTION_SX}
    >
      <Box sx={DEMO_FRAME_SX}>
        <Box
          role={onActivate ? "button" : undefined}
          tabIndex={onActivate ? 0 : undefined}
          aria-label={onActivate ? t("landing.demo.activate") : undefined}
          onPointerEnter={activateInline}
          onTouchStart={activateInline}
          onClick={activateInline}
          onKeyDown={(event: React.KeyboardEvent) => {
            if (ACTIVATION_KEYS.includes(event.key)) {
              event.preventDefault();
              activateInline();
            }
          }}
          sx={{
            display: "block",
            aspectRatio: `${DEMO_CANVAS_WIDTH} / ${DEMO_CANVAS_HEIGHT}`,
            borderRadius: "15px",
            overflow: "hidden",
            background: "var(--canvas)",
            boxShadow: "0 0 0 1px var(--line)",
          }}
        >
          <Box
            component="img"
            src={DEMO_POSTER_SRC}
            srcSet={DEMO_POSTER_SRCSET}
            sizes={DEMO_POSTER_SIZES}
            alt=""
            width={DEMO_CANVAS_WIDTH}
            height={DEMO_CANVAS_HEIGHT}
            decoding="async"
            sx={{ display: "block", width: "100%", height: "auto" }}
          />
        </Box>
      </Box>

      <DemoFullscreenButton
        onClick={() => onActivate?.(DEMO_MODES.fullscreen)}
      />
    </Box>
  );
};
