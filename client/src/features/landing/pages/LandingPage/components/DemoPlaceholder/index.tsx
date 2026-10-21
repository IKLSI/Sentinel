import type React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import OpenInFullOutlined from "@mui/icons-material/OpenInFullOutlined";
import { useT } from "@/contexts/I18nContext";
import {
  DEMO_CANVAS_HEIGHT,
  DEMO_CANVAS_WIDTH,
  DEMO_MODES,
  DEMO_POSTER_SIZES,
  DEMO_POSTER_SRC,
  DEMO_POSTER_SRCSET,
  type DemoMode,
} from "@/features/landing/demo/constants";

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
      sx={{
        width: "100%",
        maxWidth: "1240px",
        boxSizing: "border-box",
        mx: "auto",
        mt: { xs: "48px", md: "72px" },
        px: { xs: "20px", md: "40px" },
      }}
    >
      <Box
        sx={{
          borderRadius: "22px",
          p: "8px",
          background: "var(--tint)",
          boxShadow:
            "0 0 0 1px var(--line), 0 50px 90px -50px rgba(80, 72, 229, 0.35)",
        }}
      >
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
            background: "#f0f2f8",
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

      <Box sx={{ display: "flex", justifyContent: "center", mt: "20px" }}>
        <ButtonBase
          onClick={() => onActivate?.(DEMO_MODES.fullscreen)}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            px: "14px",
            py: "7px",
            borderRadius: "999px",
            fontFamily: "inherit",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--ink)",
            background: "#ffffff",
            boxShadow: "0 0 0 1px var(--line)",
            "&:hover": { background: "var(--tint)" },
            "&.Mui-focusVisible": { outline: "2px solid var(--indigo)" },
          }}
        >
          <OpenInFullOutlined aria-hidden sx={{ fontSize: 16 }} />
          {t("landing.demo.open_fullscreen")}
        </ButtonBase>
      </Box>
    </Box>
  );
};
