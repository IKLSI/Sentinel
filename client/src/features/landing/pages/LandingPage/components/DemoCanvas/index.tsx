import type React from "react";
import { RouterProvider } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import {
  DEMO_CANVAS_HEIGHT,
  DEMO_CANVAS_WIDTH,
} from "@/features/landing/demo/constants";
import type { DemoRouter } from "@/features/landing/demo/router";

interface Props {
  router: DemoRouter;
  scale: number;
}

export const DemoCanvas: React.FC<Props> = ({ router, scale }) => (
  <Box
    style={{ transform: `scale(${scale})` }}
    sx={{
      width: `${DEMO_CANVAS_WIDTH}px`,
      height: `${DEMO_CANVAS_HEIGHT}px`,
      transformOrigin: "0 0",
      overflow: "hidden",
      background: "var(--bg)",
      color: "var(--text)",
      typography: "body1",
      fontFeatureSettings: '"cv02", "cv03", "cv04", "cv11"',
    }}
  >
    <RouterProvider router={router} />
  </Box>
);
