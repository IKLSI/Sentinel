import type React from "react";
import { Outlet, useLocation } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { PageTransition } from "@/components/layout/PageTransition";
import { MobileMenuButton } from "@/components/layout/MobileMenuButton";

const SIDEBAR_GAP = 12;

const AppContent: React.FC = () => {
  const { isCollapsed, isMobile } = useSidebar();
  const pathname = useLocation({ select: (location) => location.pathname });
  const collapsed = isCollapsed && !isMobile;
  const ml = isMobile ? 0 : (collapsed ? 56 : 200) + SIDEBAR_GAP * 2;

  return (
    <Box
      sx={{
        flex: 1,
        overflowY: "auto",
        height: "100vh",
        bgcolor: "background.default",
        ml: `${ml}px`,
        pt: isMobile ? "56px" : 0,
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
        <MobileMenuButton />
        <AppContent />
      </Box>
    </SidebarProvider>
  );
};
