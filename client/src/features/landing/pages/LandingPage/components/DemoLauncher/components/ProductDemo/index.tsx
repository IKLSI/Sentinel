import type React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import {
  DEMO_CANVAS_HEIGHT,
  DEMO_FRAME_SX,
  DEMO_SECTION_SX,
} from "@/features/landing/demo/constants";
import { useContainerFitScale } from "@/features/landing/demo/hooks";
import {
  createDemoRouter,
  type DemoRouter,
} from "@/features/landing/demo/router";
import { DemoCanvas } from "@/features/landing/pages/LandingPage/components/DemoLauncher/components/ProductDemo/components/DemoCanvas";
import { DemoFullscreenButton } from "@/features/landing/pages/LandingPage/components/DemoLauncher/components/DemoFullscreenButton";
import { DemoFullscreen } from "@/features/landing/pages/LandingPage/components/DemoLauncher/components/ProductDemo/components/DemoFullscreen";
import { DemoScope } from "@/features/landing/pages/LandingPage/components/DemoLauncher/components/ProductDemo/components/DemoScope";

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
      sx={{ ...DEMO_SECTION_SX, minWidth: 0 }}
    >
      <Box sx={{ ...DEMO_FRAME_SX, position: "relative" }}>
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

      <DemoFullscreenButton onClick={openFullscreen} />

      {fullscreenRouter && (
        <DemoFullscreen router={fullscreenRouter} onClose={closeFullscreen} />
      )}
    </Box>
  );
};
