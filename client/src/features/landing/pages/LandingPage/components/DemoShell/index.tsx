import type React from "react";
import { Outlet } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import {
  DEMO_SIDEBAR_GAP,
  DEMO_SIDEBAR_WIDTH,
} from "@/features/landing/demo/constants";
import { DemoSidebar } from "@/features/landing/pages/LandingPage/components/DemoSidebar";

export const DemoShell: React.FC = () => (
  <Box
    sx={{
      position: "relative",
      display: "flex",
      width: "100%",
      height: "100%",
      overflow: "hidden",
      background: "var(--bg)",
    }}
  >
    <DemoSidebar />
    <Box
      component="main"
      sx={{
        flex: 1,
        minWidth: 0,
        height: "100%",
        overflowY: "auto",
        ml: `${DEMO_SIDEBAR_WIDTH + DEMO_SIDEBAR_GAP * 2}px`,
        background: "var(--bg)",
      }}
    >
      <Outlet />
    </Box>
  </Box>
);
