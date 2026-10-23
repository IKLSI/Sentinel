import type React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import OpenInFullOutlined from "@mui/icons-material/OpenInFullOutlined";
import { useT } from "@/contexts/I18nContext";
import { DEMO_CANVAS_HEIGHT } from "@/features/landing/demo/constants";
import { useContainerFitScale } from "@/features/landing/demo/hooks";
import {
  createDemoRouter,
  type DemoRouter,
} from "@/features/landing/demo/router";
import { DemoCanvas } from "@/features/landing/pages/LandingPage/components/DemoCanvas";
import { DemoFullscreen } from "@/features/landing/pages/LandingPage/components/DemoFullscreen";
import { DemoScope } from "@/features/landing/pages/LandingPage/components/DemoScope";

interface Props {
  openFullscreenOnMount?: boolean;
}

export const ProductDemo: React.FC<Props> = ({
  openFullscreenOnMount = false,
}) => {
  const t = useT();
  const [router] = useState(() => createDemoRouter());
  const [fullscreenRouter, setFullscreenRouter] = useState<DemoRouter | null>(
    () => (openFullscreenOnMount ? createDemoRouter() : null),
  );
  const { ref, scale } = useContainerFitScale<HTMLDivElement>();

  const openFullscreen = () =>
    setFullscreenRouter(createDemoRouter(router.state.location.pathname));

  const closeFullscreen = () => {
    if (fullscreenRouter)
      router.history.push(fullscreenRouter.state.location.pathname);
    setFullscreenRouter(null);
  };

  return (
    <Box
      component="section"
      aria-label={t("landing.demo.label")}
      sx={{
        width: "100%",
        maxWidth: "1240px",
        minWidth: 0,
        boxSizing: "border-box",
        mx: "auto",
        mt: { xs: "48px", md: "72px" },
        px: { xs: "20px", md: "40px" },
      }}
    >
      <Box
        sx={{
          position: "relative",
          borderRadius: "22px",
          p: "8px",
          background: "var(--tint)",
          boxShadow:
            "0 0 0 1px var(--line), 0 50px 90px -50px color-mix(in srgb, var(--indigo) 35%, transparent)",
        }}
      >
        <DemoScope>
          <Box
            ref={ref}
            style={{ height: DEMO_CANVAS_HEIGHT * scale }}
            sx={{
              position: "relative",
              contain: "inline-size",
              overflow: "hidden",
              borderRadius: "15px",
              boxShadow: "0 0 0 1px var(--border)",
            }}
          >
            <DemoCanvas router={router} scale={scale} />
          </Box>
        </DemoScope>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "center", mt: "20px" }}>
        <ButtonBase
          onClick={openFullscreen}
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
            background: "var(--page)",
            boxShadow: "0 0 0 1px var(--line)",
            "&:hover": { background: "var(--tint)" },
            "&.Mui-focusVisible": { outline: "2px solid var(--indigo)" },
          }}
        >
          <OpenInFullOutlined aria-hidden sx={{ fontSize: 16 }} />
          {t("landing.demo.open_fullscreen")}
        </ButtonBase>
      </Box>

      {fullscreenRouter && (
        <DemoFullscreen router={fullscreenRouter} onClose={closeFullscreen} />
      )}
    </Box>
  );
};
