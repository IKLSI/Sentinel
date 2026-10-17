import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/contexts/SidebarContext";
import { UserRole } from "@/enums";
import { CollapsedSectionButton } from "@/components/layout/Sidebar/components/CollapsedSectionButton";
import { Footer } from "@/components/layout/Sidebar/components/Footer";
import { Header } from "@/components/layout/Sidebar/components/Header";
import { NavGroupSection } from "@/components/layout/Sidebar/components/NavGroupSection";
import {
  NAV_GROUPS,
  NAV_SECTIONS,
} from "@/components/layout/Sidebar/constants";
import {
  isSectionActive,
  sectionKey,
} from "@/components/layout/Sidebar/helpers";

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const pathname = useLocation({ select: (location) => location.pathname });
  const { isOpen, isMobile, isCollapsed, close, toggleCollapse } = useSidebar();

  const collapsed = isCollapsed && !isMobile;

  const isAdmin = user?.role === UserRole.Admin;
  const filteredSections = useMemo(() => {
    return NAV_SECTIONS.filter((s) => !s.adminOnly || isAdmin)
      .map((s) => ({
        ...s,
        items: s.items.filter((item) => !item.adminOnly || isAdmin),
      }))
      .filter((s) => s.items.length > 0);
  }, [isAdmin]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const s of NAV_SECTIONS.filter((s) => s.items.length > 1))
      init[sectionKey(s)] = isSectionActive(s, pathname);
    return init;
  });

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    for (const s of filteredSections) {
      if (s.items.length > 1 && isSectionActive(s, pathname))
        setOpenGroups((prev) =>
          prev[sectionKey(s)] ? prev : { ...prev, [sectionKey(s)]: true },
        );
    }
  }, [pathname, filteredSections]);

  useEffect(() => {
    if (isMobile) close();
  }, [isMobile, close]);

  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, isOpen]);

  if (isMobile && !isOpen) return null;

  return (
    <>
      {isMobile && (
        <Box
          onClick={close}
          sx={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 199,
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      <Box
        sx={{
          width: collapsed ? "56px" : "200px",
          flexShrink: 0,
          height: isMobile ? "100vh" : "calc(100vh - 40px)",
          background: "var(--s1)",
          border: "1px solid var(--border)",
          borderRadius: isMobile ? 0 : "var(--r-lg)",
          boxShadow: isMobile
            ? "none"
            : "var(--sh-2), inset 0 1px 0 rgba(255,255,255,0.04)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          left: isMobile ? 0 : "12px",
          top: isMobile ? 0 : "20px",
          zIndex: isMobile ? 200 : 100,
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "none",
          transition:
            "width 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s, border-radius 0.2s",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        <Header
          collapsed={collapsed}
          isMobile={isMobile}
          onToggleCollapse={toggleCollapse}
        />

        <Box
          component="nav"
          sx={{
            flex: 1,
            p: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {collapsed
            ? filteredSections.map((section) => (
                <CollapsedSectionButton
                  key={section.titleKey}
                  section={section}
                  pathname={pathname}
                />
              ))
            : NAV_GROUPS.map((group) => (
                <NavGroupSection
                  key={group.groupKey}
                  group={group}
                  sections={filteredSections}
                  pathname={pathname}
                  openGroups={openGroups}
                  onToggleGroup={toggleGroup}
                />
              ))}
        </Box>

        <Footer collapsed={collapsed} />
      </Box>
    </>
  );
};
