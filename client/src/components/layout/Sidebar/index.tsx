import type React from "react";
import { Fragment, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { ROUTES } from "@/constants/routes";
import { useT } from "@/contexts/I18nContext";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useSidebar } from "@/contexts/SidebarContext";
import { Header } from "@/components/layout/Sidebar/components/Header";
import { ProfileButton } from "@/components/layout/Sidebar/components/ProfileButton";
import { SectionHeader } from "@/components/layout/Sidebar/components/SectionHeader";
import { SectionLink } from "@/components/layout/Sidebar/components/SectionLink";
import {
  NAV_GROUPS,
  NAV_SECTIONS,
} from "@/components/layout/Sidebar/constants";
import type { NavItem } from "@/components/layout/Sidebar/types";

function isItemActive(item: NavItem, pathname: string): boolean {
  if (item.activeFor?.test(pathname)) return true;
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export const Sidebar: React.FC = () => {
  const pathname = useLocation({ select: (location) => location.pathname });
  const { isOpen, isMobile, isCollapsed, close, toggleCollapse } = useSidebar();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const t = useT();

  const collapsed = isCollapsed && !isMobile;

  const isAdmin = useIsAdmin();
  const filteredSections = useMemo(
    () => NAV_SECTIONS.filter((s) => !s.adminOnly || isAdmin),
    [isAdmin],
  );

  useEffect(() => {
    if (isMobile && pathname) close();
  }, [isMobile, pathname, close]);

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

  const handleLogout = async () => {
    await logout().catch(() => undefined);
    window.location.assign(ROUTES.LOGIN);
  };

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
            ? filteredSections.map((section) => {
                const [item] = section.items;
                const sectionActive = isItemActive(item, pathname);
                const ItemIcon = item.icon;
                return (
                  <AppTooltip
                    key={section.titleKey}
                    title={t(section.titleKey)}
                    placement="right"
                  >
                    <ButtonBase
                      onClick={() => navigate({ to: item.to })}
                      sx={{
                        font: "inherit",
                        textAlign: "inherit",
                        height: "34px",
                        width: "100%",
                        boxSizing: "border-box",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "var(--r)",
                        transition: "background 0.12s",
                        position: "relative",
                        background: sectionActive
                          ? "var(--accent-subtle)"
                          : "transparent",
                        "&:hover": !sectionActive
                          ? { background: "var(--s3)" }
                          : {},
                      }}
                    >
                      <ItemIcon
                        sx={{
                          fontSize: 16,
                          color: sectionActive
                            ? "var(--accent)"
                            : "var(--muted)",
                          transition: "color 0.12s",
                        }}
                      />
                    </ButtonBase>
                  </AppTooltip>
                );
              })
            : NAV_GROUPS.map((group) => {
                const groupSections = filteredSections.filter(
                  (s) => (s.group ?? "nav") === group.groupKey,
                );
                if (groupSections.length === 0) return null;
                return (
                  <Fragment key={group.groupKey}>
                    <SectionHeader
                      label={t(group.headerKey)}
                      mt={group.groupKey === "admin" ? "12px" : 0}
                    />
                    {groupSections.map((section) => (
                      <SectionLink key={section.titleKey} section={section} />
                    ))}
                  </Fragment>
                );
              })}
        </Box>

        <Box
          sx={{
            flexShrink: 0,
            borderTop: "1px solid var(--border)",
            px: collapsed ? "0" : "10px",
            py: "10px",
            display: "flex",
            flexDirection: collapsed ? "column" : "row",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: collapsed ? "4px" : "8px",
          }}
        >
          <ProfileButton collapsed={collapsed} />

          <Box
            sx={{
              display: "flex",
              flexDirection: collapsed ? "column" : "row",
              alignItems: "center",
              gap: "2px",
              flexShrink: 0,
            }}
          >
            <AppTooltip title={t("sidebar.logout")}>
              <IconButton
                onClick={handleLogout}
                sx={{
                  p: 0,
                  width: 26,
                  height: 26,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--r-sm)",
                  color: "var(--muted)",
                  flexShrink: 0,
                  transition: "color 0.12s, background 0.12s",
                  "&:hover": { color: "var(--red)" },
                }}
              >
                <LogoutOutlined sx={{ fontSize: 14 }} />
              </IconButton>
            </AppTooltip>
          </Box>
        </Box>
      </Box>
    </>
  );
};
