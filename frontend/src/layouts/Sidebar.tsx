import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
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
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useSidebar } from "./SidebarContext";
import { SentinelLogo } from "./SentinelLogo";
import { useT } from "../i18n/I18nContext";

interface NavItem {
  to: string;
  icon: React.ElementType;
  labelKey: string;
  end?: boolean;
}

interface NavSection {
  titleKey: string;
  icon: React.ElementType;
  items: NavItem[];
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
        to: "/tickets",
        icon: ConfirmationNumberOutlined,
        labelKey: "sidebar.item.list",
        end: true,
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
        to: "/projects",
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
        to: "/time-tracking",
        icon: AccessTimeOutlined,
        labelKey: "sidebar.item.time_tracking",
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
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(item.to + "/");
}

const ITEM_SX = {
  height: "34px",
  display: "flex",
  alignItems: "center",
  gap: "9px",
  px: "10px",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "background 0.12s, color 0.12s",
  userSelect: "none",
} as const;

const Divider = () => (
  <Box
    sx={{
      height: "1px",
      mx: "6px",
      my: "5px",
      background: "var(--border)",
      opacity: 0.6,
    }}
  />
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
    navigate("/login");
  };

  const isAdmin = user?.role === "Admin";
  const filteredSections = useMemo(
    () => navSections.filter((s) => s.items.length > 0),
    [],
  );

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const s of filteredSections) {
      if (s.items.length > 1)
        init[sectionKey(s)] = isSectionActive(s, location.pathname);
    }
    return init;
  });

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

  useEffect(() => {
    for (const s of filteredSections) {
      if (s.items.length > 1 && isSectionActive(s, location.pathname)) {
        setOpenGroups((prev) =>
          prev[sectionKey(s)] ? prev : { ...prev, [sectionKey(s)]: true },
        );
      }
    }
  }, [location.pathname, filteredSections]);

  if (isMobile && !isOpen) return null;

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

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
          width: collapsed ? "56px" : "220px",
          flexShrink: 0,
          height: "100vh",
          background: "var(--s1)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          position: isMobile ? "fixed" : "relative",
          left: 0,
          top: 0,
          zIndex: isMobile ? 200 : "auto",
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "none",
          transition: "width 0.2s cubic-bezier(0.4,0,0.2,1)",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {collapsed && !isMobile ? (
          <Tooltip title={t("sidebar.expand")} placement="right" arrow>
            <Box
              component="button"
              onClick={toggleCollapse}
              sx={{
                all: "unset",
                cursor: "pointer",
                height: "56px",
                flexShrink: 0,
                borderBottom: "1px solid var(--border)",
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
              borderBottom: "1px solid var(--border)",
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
              <Tooltip title={t("sidebar.collapse")} placement="right" arrow>
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
                    borderRadius: "5px",
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
            gap: "2px",
          }}
        >
          {filteredSections.map((section, si) => {
            const isMulti = section.items.length > 1;
            const isGroupOpen = openGroups[sectionKey(section)] ?? false;
            const sectionActive = isSectionActive(section, location.pathname);
            const GroupIcon = section.icon;
            const sectionTitle = t(section.titleKey);

            if (collapsed) {
              const targetTo =
                section.items.find((i) => isItemActive(i, location.pathname))
                  ?.to ?? section.items[0].to;
              return (
                <React.Fragment key={section.titleKey}>
                  {si > 0 && <Divider />}
                  <Tooltip title={sectionTitle} placement="right" arrow>
                    <Box
                      component="button"
                      onClick={() => navigate(targetTo)}
                      sx={{
                        all: "unset",
                        height: "34px",
                        width: "100%",
                        boxSizing: "border-box",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "background 0.12s",
                        "&:hover": { background: "var(--s3)" },
                      }}
                    >
                      <GroupIcon
                        sx={{
                          fontSize: 16,
                          color: sectionActive
                            ? "var(--accent)"
                            : "var(--muted)",
                          transition: "color 0.12s",
                        }}
                      />
                    </Box>
                  </Tooltip>
                </React.Fragment>
              );
            }

            return (
              <React.Fragment key={section.titleKey}>
                {si > 0 && <Divider />}

                {isMulti ? (
                  <>
                    <Box
                      component="button"
                      onClick={() => toggleGroup(sectionKey(section))}
                      sx={{
                        all: "unset",
                        ...ITEM_SX,
                        width: "100%",
                        boxSizing: "border-box",
                        color: sectionActive
                          ? "var(--text)"
                          : "var(--text-secondary)",
                        "&:hover .nav-label": !sectionActive
                          ? { color: "var(--text)" }
                          : {},
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
                            ? "var(--text)"
                            : "var(--muted2)",
                          transition: "color 0.15s",
                        }}
                      >
                        {sectionTitle}
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
                          ? `${section.items.length * 32}px`
                          : "0px",
                        ml: "15px",
                        borderLeft: `2px solid ${sectionActive ? "var(--accent-border)" : "var(--border)"}`,
                        transition:
                          "max-height 0.2s cubic-bezier(0.4,0,0.2,1), border-color 0.2s",
                      }}
                    >
                      {section.items.map((item) => {
                        const active = isItemActive(item, location.pathname);
                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end ?? false}
                            className="d-block text-decoration-none"
                          >
                            <Box
                              sx={{
                                height: "28px",
                                display: "flex",
                                alignItems: "center",
                                pl: "12px",
                                pr: "8px",
                                mx: "4px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                background: "transparent",
                                "&:hover .nav-label": !active
                                  ? { color: "var(--text)" }
                                  : {},
                              }}
                            >
                              <Box
                                component="span"
                                className="nav-label"
                                sx={{
                                  fontFamily: "'Space Grotesk', sans-serif",
                                  fontSize: "10px",
                                  fontWeight: active ? 700 : 500,
                                  letterSpacing: "0.1em",
                                  textTransform: "uppercase",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
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
                  </>
                ) : (
                  <NavLink
                    to={section.items[0].to}
                    end={section.items[0].end ?? false}
                    className="d-block text-decoration-none"
                  >
                    {({ isActive }) => {
                      const Icon = section.items[0].icon;
                      return (
                        <Box
                          sx={{
                            ...ITEM_SX,
                            background: "transparent",
                            color: isActive
                              ? "var(--accent)"
                              : "var(--text-secondary)",
                            "&:hover .nav-label": !isActive
                              ? { color: "var(--text)" }
                              : {},
                          }}
                        >
                          <Icon
                            sx={{
                              fontSize: 16,
                              flexShrink: 0,
                              color: isActive
                                ? "var(--accent)"
                                : "var(--muted)",
                              transition: "color 0.12s",
                            }}
                          />
                          <Box
                            component="span"
                            className="nav-label"
                            sx={{
                              fontSize: "10.5px",
                              fontWeight: 700,
                              letterSpacing: "0.07em",
                              textTransform: "uppercase",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              color: isActive ? "var(--text)" : "var(--muted2)",
                              transition: "color 0.15s",
                            }}
                          >
                            {t(section.items[0].labelKey)}
                          </Box>
                        </Box>
                      );
                    }}
                  </NavLink>
                )}
              </React.Fragment>
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
          <Tooltip
            title={collapsed ? `${user?.firstName} ${user?.lastName}` : ""}
            placement="right"
            arrow
          >
            <Box
              component="button"
              onClick={() => navigate("/profile")}
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

          {isAdmin && (
            <Tooltip title={t("sidebar.settings")} placement="right" arrow>
              <Box
                component="button"
                onClick={() => navigate("/settings")}
                sx={{
                  all: "unset",
                  cursor: "pointer",
                  width: 26,
                  height: 26,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "6px",
                  color: "var(--muted)",
                  flexShrink: 0,
                  transition: "color 0.12s, background 0.12s",
                  "&:hover": {
                    color: "var(--accent)",
                    background: "var(--accent-subtle)",
                  },
                }}
              >
                <SettingsOutlined sx={{ fontSize: 14 }} />
              </Box>
            </Tooltip>
          )}

          <Tooltip title={t("sidebar.logout")} placement="right" arrow>
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
                borderRadius: "6px",
                color: "var(--muted)",
                flexShrink: 0,
                transition: "color 0.12s, background 0.12s",
                "&:hover": {
                  color: "var(--red)",
                  background: "var(--red-subtle)",
                },
              }}
            >
              <LogoutOutlined sx={{ fontSize: 14 }} />
            </Box>
          </Tooltip>
        </Box>
      </Box>
    </>
  );
};
