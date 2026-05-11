import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import { Sidebar } from "./Sidebar";
import { SidebarProvider } from "./SidebarContext";
import { useSidebar } from "./SidebarContext";
import { PageTransition } from "./PageTransition";
import { CommandPalette } from "@/components/CommandPalette";

const SIDEBAR_GAP = 12;

const AppContent: React.FC = () => {
  const { isCollapsed, isMobile } = useSidebar();
  const { pathname } = useLocation();
  const collapsed = isCollapsed && !isMobile;
  const ml = isMobile ? 0 : (collapsed ? 56 : 220) + SIDEBAR_GAP * 2;

  return (
    <Box
      sx={{
        flex: 1,
        overflowY: "auto",
        height: "100vh",
        bgcolor: "background.default",
        ml: `${ml}px`,
        transition: "margin-left 0.2s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <div key={pathname} className="page-progress-bar" aria-hidden="true" />
      <PageTransition>
        <Outlet />
      </PageTransition>
    </Box>
  );
};

export const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
          width: "100%",
          bgcolor: "background.default",
        }}
      >
        <Sidebar />
        <AppContent />
      </Box>
      <CommandPalette />
    </SidebarProvider>
  );
};
