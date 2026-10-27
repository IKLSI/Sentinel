import type React from "react";
import { Outlet, useLocation } from "@tanstack/react-router";
import MenuOutlined from "@mui/icons-material/MenuOutlined";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { useT } from "@/contexts/I18nContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { PageTransition } from "@/components/layout/PageTransition";
import {
  EASE_OUT_EXPO,
  pageProgress,
  REDUCED_MOTION,
} from "@/styles/keyframes";

const SIDEBAR_GAP = 12;

const PROGRESS_BAR_SX = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  height: 2,
  zIndex: 9999,
  pointerEvents: "none",
  background: "var(--accent)",
  transformOrigin: "left center",
  animation: `${pageProgress} 0.6s ${EASE_OUT_EXPO} forwards`,
  [REDUCED_MOTION]: { display: "none" },
} as const;

const AppContent: React.FC = () => {
  const { isCollapsed, isMobile, isOpen, toggle } = useSidebar();
  const t = useT();
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
      {isMobile && !isOpen && (
        <IconButton
          aria-label={t("sidebar.open_menu")}
          aria-expanded={isOpen}
          onClick={toggle}
          sx={{
            position: "fixed",
            top: "10px",
            left: "10px",
            zIndex: 150,
            background: "var(--s1)",
            border: "1px solid var(--border)",
            boxShadow: "var(--sh-2)",
            "&:hover": { background: "var(--s3)" },
          }}
        >
          <MenuOutlined />
        </IconButton>
      )}
      <Box key={pathname} sx={PROGRESS_BAR_SX} aria-hidden="true" />
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
    </SidebarProvider>
  );
};
