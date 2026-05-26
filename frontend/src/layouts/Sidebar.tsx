import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import ConfirmationNumberOutlined from "@mui/icons-material/ConfirmationNumberOutlined";
import ViewKanbanOutlined from "@mui/icons-material/ViewKanbanOutlined";
import AccountTreeOutlined from "@mui/icons-material/AccountTreeOutlined";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import AssessmentOutlined from "@mui/icons-material/AssessmentOutlined";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import KeyboardDoubleArrowLeftOutlined from "@mui/icons-material/KeyboardDoubleArrowLeftOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import NotificationsNone from "@mui/icons-material/NotificationsNone";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useSidebar } from "./SidebarContext";
import { SentinelLogo } from "./SentinelLogo";
import { useT } from "../i18n/I18nContext";
import { PALETTE_OPEN_EVENT } from "../components/CommandPalette";
import { useNotifications } from "../features/notifications/useNotifications";
import { UserRole } from "../types/enums";
import { NotificationsModal } from "../features/notifications/NotificationsModal";

interface NavItem {
  to: string;
  icon: React.ElementType;
  labelKey: string;
  end?: boolean;
  activeFor?: RegExp;
  adminOnly?: boolean;
}

interface NavSection {
  titleKey: string;
  icon: React.ElementType;
  items: NavItem[];
  adminOnly?: boolean;
  group?: "nav" | "admin";
}

const navSections: NavSection[] = [
  {
    titleKey: "sidebar.section.dashboard",
    icon: DashboardOutlined,
    items: [
      {
        to: "/",
        icon: DashboardOutlined,
        labelKey: "sidebar.item.dashboard",
        end: true,
      },
    ],
  },
  {
    titleKey: "sidebar.section.tickets",
    icon: ConfirmationNumberOutlined,
    items: [
      {
        to: ROUTES.TICKETS,
        icon: ConfirmationNumberOutlined,
        labelKey: "sidebar.item.list",
        end: true,
        activeFor: /^\/tickets\/(?!kanban).+/,
      },
      {
        to: "/tickets/kanban",
        icon: ViewKanbanOutlined,
        labelKey: "sidebar.item.kanban",
      },
    ],
  },
  {
    titleKey: "sidebar.section.projects",
    icon: AccountTreeOutlined,
    items: [
      {
        to: ROUTES.PROJECTS,
        icon: AccountTreeOutlined,
        labelKey: "sidebar.item.projects",
      },
    ],
  },
  {
    titleKey: "sidebar.section.resources",
    icon: AssessmentOutlined,
    items: [
      {
        to: ROUTES.TIME_TRACKING,
        icon: AccessTimeOutlined,
        labelKey: "sidebar.item.time_tracking",
      },
    ],
  },
  {
    titleKey: "sidebar.section.administration",
    icon: SettingsOutlined,
    adminOnly: true,
    group: "admin",
    items: [
      {
        to: ROUTES.SETTINGS,
        icon: SettingsOutlined,
        labelKey: "sidebar.item.settings",
      },
    ],
  },
];

function isSectionActive(section: NavSection, pathname: string): boolean {
  return section.items.some((item) => isItemActive(item, pathname));
}

function sectionKey(section: NavSection): string {
  return section.titleKey;
}

function isItemActive(item: NavItem, pathname: string): boolean {
  if (item.activeFor && item.activeFor.test(pathname)) return true;
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(item.to + "/");
}

const ITEM_SX = {
  height: "34px",
  display: "flex",
  alignItems: "center",
  gap: "9px",
  px: "10px",
  borderRadius: "var(--r)",
  cursor: "pointer",
  transition: "background 0.12s, color 0.12s",
  userSelect: "none",
} as const;

const SectionHeader = ({
  label,
  mt,
}: {
  label: string;
  mt?: string | number;
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      px: "4px",
      pt: "8px",
      pb: "4px",
      mt: mt ?? 0,
    }}
  >
    <Box
      component="span"
      sx={{
        fontSize: "9px",
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--muted)",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {label}
    </Box>
    <Box
      sx={{ flex: 1, height: "1px", background: "var(--border)", opacity: 0.8 }}
    />
  </Box>
);

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, isMobile, isCollapsed, close, toggleCollapse } = useSidebar();
  const t = useT();

  const collapsed = isCollapsed && !isMobile;

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const isAdmin = user?.role === UserRole.Admin;
  const isClient = user?.role === UserRole.Client;
  const { unreadCount } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const filteredSections = useMemo(() => {
    const clientAllowed = ["sidebar.section.tickets"];
    return navSections
      .filter((s) => !isClient || clientAllowed.includes(s.titleKey))
      .filter((s) => !s.adminOnly || isAdmin)
      .map((s) => ({
        ...s,
        items: s.items.filter((item) => !item.adminOnly || isAdmin),
      }))
      .filter((s) => s.items.length > 0);
  }, [isClient, isAdmin]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const s of navSections.filter((s) => s.items.length > 1))
      init[sectionKey(s)] = isSectionActive(s, location.pathname);
    return init;
  });

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    for (const s of filteredSections) {
      if (s.items.length > 1 && isSectionActive(s, location.pathname))
        setOpenGroups((prev) =>
          prev[sectionKey(s)] ? prev : { ...prev, [sectionKey(s)]: true },
        );
    }
  }, [location.pathname, filteredSections]);

  useEffect(() => {
    if (isMobile) close();
  }, [location.pathname, isMobile, close]);

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
            : "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.03)",
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
        {collapsed && !isMobile ? (
          <Tooltip title={t("sidebar.expand")} placement="top" arrow>
            <Box
              component="button"
              onClick={toggleCollapse}
              sx={{
                all: "unset",
                cursor: "pointer",
                height: "56px",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                transition: "background 0.12s",
                "&:hover": { background: "var(--s3)" },
              }}
            >
              <SentinelLogo />
            </Box>
          </Tooltip>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: "14px",
              height: "56px",
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <SentinelLogo />
              <Box>
                <Box
                  sx={{
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    color: "var(--text)",
                    lineHeight: 1,
                  }}
                >
                  {t("sidebar.brand")}
                </Box>
                <Box
                  sx={{
                    fontSize: "9px",
                    color: "var(--muted)",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    mt: "3px",
                  }}
                >
                  {t("sidebar.workspace")}
                </Box>
              </Box>
            </Box>

            {!isMobile && (
              <Tooltip title={t("sidebar.collapse")} placement="top" arrow>
                <Box
                  component="button"
                  onClick={toggleCollapse}
                  sx={{
                    all: "unset",
                    cursor: "pointer",
                    width: 22,
                    height: 22,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "var(--r-sm)",
                    color: "var(--muted)",
                    flexShrink: 0,
                    ml: "4px",
                    transition: "color 0.12s, background 0.12s",
                    "&:hover": {
                      color: "var(--text)",
                      background: "var(--s3)",
                    },
                  }}
                >
                  <KeyboardDoubleArrowLeftOutlined sx={{ fontSize: 14 }} />
                </Box>
              </Tooltip>
            )}
          </Box>
        )}

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
          {collapsed ? (
            <Tooltip title={t("palette.placeholder")} placement="right" arrow>
              <Box
                component="button"
                onClick={() =>
                  window.dispatchEvent(new Event(PALETTE_OPEN_EVENT))
                }
                sx={{
                  all: "unset",
                  height: "34px",
                  width: "100%",
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--r)",
                  cursor: "pointer",
                  mb: "4px",
                  transition: "background 0.12s",
                  "&:hover": { background: "var(--s3)" },
                }}
              >
                <SearchOutlined sx={{ fontSize: 16, color: "var(--muted)" }} />
              </Box>
            </Tooltip>
          ) : (
            <Box
              component="button"
              onClick={() =>
                window.dispatchEvent(new Event(PALETTE_OPEN_EVENT))
              }
              sx={{
                all: "unset",
                height: "30px",
                width: "100%",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                px: "10px",
                mb: "12px",
                borderRadius: "var(--r)",
                cursor: "pointer",
                border: "1px solid var(--border)",
                background: "var(--s2)",
                transition: "background 0.12s, border-color 0.12s",
                "&:hover": {
                  background: "var(--s3)",
                  borderColor: "var(--border-hover, var(--muted2))",
                },
              }}
            >
              <SearchOutlined
                sx={{ fontSize: 14, color: "var(--muted)", flexShrink: 0 }}
              />
              <Box
                component="span"
                sx={{
                  fontSize: "11px",
                  color: "var(--muted)",
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {t("sidebar.search")}
              </Box>
            </Box>
          )}
          {collapsed ? (
            filteredSections.map((section) => {
              const sectionActive = isSectionActive(section, location.pathname);
              const activeItem =
                section.items.find((i) => isItemActive(i, location.pathname)) ??
                section.items[0];
              const ItemIcon = activeItem.icon ?? section.icon;
              return (
                <Tooltip
                  key={section.titleKey}
                  title={t(section.titleKey)}
                  placement="right"
                  arrow
                >
                  <Box
                    component="button"
                    onClick={() => navigate(activeItem.to)}
                    sx={{
                      all: "unset",
                      height: "34px",
                      width: "100%",
                      boxSizing: "border-box",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "var(--r)",
                      cursor: "pointer",
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
                        color: sectionActive ? "var(--accent)" : "var(--muted)",
                        transition: "color 0.12s",
                      }}
                    />
                  </Box>
                </Tooltip>
              );
            })
          ) : (
            <>
              {[
                { groupKey: "nav" as const, headerKey: "sidebar.section.nav" },
                {
                  groupKey: "admin" as const,
                  headerKey: "sidebar.section.administration",
                },
              ].map(({ groupKey, headerKey }) => {
                const groupSections = filteredSections.filter(
                  (s) => (s.group ?? "nav") === groupKey,
                );
                if (groupSections.length === 0) return null;
                return (
                  <React.Fragment key={groupKey}>
                    <SectionHeader
                      label={t(headerKey)}
                      mt={groupKey === "admin" ? "12px" : 0}
                    />
                    {groupSections.map((section) => {
                      const isMulti = section.items.length > 1;
                      const sectionActive = isSectionActive(
                        section,
                        location.pathname,
                      );
                      const isGroupOpen =
                        openGroups[sectionKey(section)] ?? false;

                      if (isMulti) {
                        const GroupIcon = section.icon;
                        return (
                          <React.Fragment key={section.titleKey}>
                            <Box
                              component="button"
                              onClick={() => toggleGroup(sectionKey(section))}
                              sx={{
                                all: "unset",
                                ...ITEM_SX,
                                width: "100%",
                                boxSizing: "border-box",
                                background:
                                  sectionActive && !isGroupOpen
                                    ? "var(--accent-subtle)"
                                    : "transparent",
                                "&:hover": { background: "var(--s3)" },
                              }}
                            >
                              <GroupIcon
                                sx={{
                                  fontSize: 16,
                                  color: sectionActive
                                    ? "var(--accent)"
                                    : "var(--muted)",
                                  flexShrink: 0,
                                  transition: "color 0.12s",
                                }}
                              />
                              <Box
                                component="span"
                                className="nav-label"
                                sx={{
                                  flex: 1,
                                  fontSize: "10.5px",
                                  fontWeight: 700,
                                  letterSpacing: "0.07em",
                                  textTransform: "uppercase",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  color: sectionActive
                                    ? "var(--accent)"
                                    : "var(--muted2)",
                                  transition: "color 0.15s",
                                }}
                              >
                                {t(section.titleKey)}
                              </Box>
                              <ChevronRightOutlined
                                sx={{
                                  fontSize: 14,
                                  color: "var(--muted)",
                                  flexShrink: 0,
                                  transform: isGroupOpen
                                    ? "rotate(90deg)"
                                    : "rotate(0deg)",
                                  transition:
                                    "transform 0.18s cubic-bezier(0.4,0,0.2,1)",
                                }}
                              />
                            </Box>
                            <Box
                              sx={{
                                overflow: "hidden",
                                maxHeight: isGroupOpen
                                  ? `${section.items.length * 34}px`
                                  : "0px",
                                ml: "15px",
                                borderLeft: `2px solid ${sectionActive ? "var(--accent-border)" : "var(--border)"}`,
                                transition:
                                  "max-height 0.2s cubic-bezier(0.4,0,0.2,1), border-color 0.2s",
                              }}
                            >
                              {section.items.map((item) => {
                                const active = isItemActive(
                                  item,
                                  location.pathname,
                                );
                                return (
                                  <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end ?? false}
                                    style={{
                                      textDecoration: "none",
                                      display: "block",
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        height: "30px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        pl: "10px",
                                        pr: "8px",
                                        mx: "4px",
                                        borderRadius: "var(--r-xs)",
                                        cursor: "pointer",
                                        "&:hover span.sub-label": !active
                                          ? { color: "var(--text-secondary)" }
                                          : {},
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          width: "5px",
                                          height: "5px",
                                          borderRadius: "50%",
                                          flexShrink: 0,
                                          background: active
                                            ? "var(--accent)"
                                            : "var(--border2)",
                                          transition: "background 0.15s",
                                        }}
                                      />
                                      <Box
                                        component="span"
                                        className="sub-label"
                                        sx={{
                                          fontFamily:
                                            "'Space Grotesk', sans-serif",
                                          fontSize: "10px",
                                          fontWeight: active ? 600 : 400,
                                          letterSpacing: "0.08em",
                                          textTransform: "uppercase",
                                          color: active
                                            ? "var(--accent)"
                                            : "var(--muted)",
                                          transition: "color 0.15s",
                                        }}
                                      >
                                        {t(item.labelKey)}
                                      </Box>
                                    </Box>
                                  </NavLink>
                                );
                              })}
                            </Box>
                          </React.Fragment>
                        );
                      }

                      const Icon = section.items[0].icon;
                      return (
                        <NavLink
                          key={section.titleKey}
                          to={section.items[0].to}
                          end={section.items[0].end ?? false}
                          style={{ textDecoration: "none", display: "block" }}
                        >
                          {({ isActive }) => (
                            <Box
                              sx={{
                                ...ITEM_SX,
                                background: isActive
                                  ? "var(--accent-subtle)"
                                  : "transparent",
                                "&:hover": !isActive
                                  ? { background: "var(--s3)" }
                                  : {},
                              }}
                            >
                              <Icon
                                sx={{
                                  fontSize: 16,
                                  color: isActive
                                    ? "var(--accent)"
                                    : "var(--muted)",
                                  flexShrink: 0,
                                  transition: "color 0.12s",
                                }}
                              />
                              <Box
                                component="span"
                                sx={{
                                  fontSize: "10.5px",
                                  fontWeight: 700,
                                  letterSpacing: "0.07em",
                                  textTransform: "uppercase",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  color: isActive
                                    ? "var(--accent)"
                                    : "var(--muted2)",
                                  transition: "color 0.15s",
                                }}
                              >
                                {t(section.items[0].labelKey)}
                              </Box>
                            </Box>
                          )}
                        </NavLink>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </>
          )}
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
          <Tooltip
            title={collapsed ? `${user?.firstName} ${user?.lastName}` : ""}
            placement="top"
            arrow
          >
            <Box
              component="button"
              onClick={() => navigate(ROUTES.PROFILE)}
              sx={{
                all: "unset",
                cursor: "pointer",
                flex: collapsed ? "none" : 1,
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                overflow: "hidden",
                transition: "opacity 0.12s",
                "&:hover": { opacity: 0.7 },
              }}
            >
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "var(--s3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--muted)",
                  flexShrink: 0,
                }}
              >
                <PersonOutlined sx={{ fontSize: 18 }} />
              </Box>
              {!collapsed && (
                <Box
                  sx={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--text)",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user?.firstName} {user?.lastName}
                </Box>
              )}
            </Box>
          </Tooltip>

          <Box
            sx={{
              display: "flex",
              flexDirection: collapsed ? "column" : "row",
              alignItems: "center",
              gap: "2px",
              flexShrink: 0,
            }}
          >
            <Tooltip
              title={t("sidebar.item.notifications")}
              placement="top"
              arrow
            >
              <Box
                component="button"
                onClick={() => setNotifOpen(true)}
                sx={{
                  all: "unset",
                  cursor: "pointer",
                  width: 26,
                  height: 26,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--r-sm)",
                  color: "var(--muted)",
                  flexShrink: 0,
                  position: "relative",
                  transition: "color 0.12s, background 0.12s",
                  "&:hover": { color: "var(--text)", background: "var(--s3)" },
                }}
              >
                <NotificationsNone sx={{ fontSize: 14 }} />
                {unreadCount > 0 && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "var(--red, #ef4444)",
                      border: "1px solid var(--s1)",
                    }}
                  />
                )}
              </Box>
            </Tooltip>
            <Tooltip title={t("sidebar.logout")} placement="top" arrow>
              <Box
                component="button"
                onClick={handleLogout}
                sx={{
                  all: "unset",
                  cursor: "pointer",
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
              </Box>
            </Tooltip>
          </Box>
        </Box>
      </Box>
      <NotificationsModal
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
      />
    </>
  );
};
