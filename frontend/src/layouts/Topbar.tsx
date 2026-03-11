import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import KeyboardArrowDownOutlined from "@mui/icons-material/KeyboardArrowDownOutlined";
import MenuOutlined from "@mui/icons-material/MenuOutlined";
import Box from "@mui/material/Box";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useTheme } from "../store/ThemeContext";
import { useSidebar } from "./SidebarContext";
import { useNotifications } from "../features/notifications/hooks/useNotifications";

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const iconBtnSx = {
  all: "unset",
  cursor: "pointer",
  width: 32,
  height: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  color: "var(--muted)",
  transition: "all 0.12s",
  position: "relative",
  flexShrink: 0,
  "&:hover": {
    borderColor: "var(--accent-border)",
    color: "var(--accent)",
    background: "var(--accent-subtle)",
  },
} as const;

export const Topbar: React.FC<TopbarProps> = ({ title, subtitle, actions }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isMobile, toggle } = useSidebar();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login");
  };

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "U";

  return (
    <Box
      className="d-flex align-items-center"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: 67,
        background: "var(--s1)",
        borderBottom: "1px solid var(--border)",
        px: isMobile ? 2 : "28px",
        gap: "12px",
        backdropFilter: "blur(8px)",
      }}
    >
      <Box className="topbar-glow" />

      {isMobile && (
        <Box component="button" sx={iconBtnSx} onClick={toggle} aria-label="Menu">
          <MenuOutlined sx={{ fontSize: 16 }} />
        </Box>
      )}

      <Box className="d-flex align-items-baseline gap-2 flex-grow-1 overflow-hidden">
        <Box
          component="span"
          className="text-truncate"
          sx={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--text)", whiteSpace: "nowrap" }}
        >
          {title}
        </Box>
        {subtitle && !isMobile && (
          <Box
            component="span"
            className="text-truncate"
            sx={{ fontSize: 13, color: "var(--muted)", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}
          >
            {subtitle}
          </Box>
        )}
      </Box>

      <Box className="d-flex align-items-center gap-2 flex-shrink-0">
        {actions && !isMobile && (
          <Box className="d-flex align-items-center gap-2">{actions}</Box>
        )}

        <Box
          component="button"
          sx={iconBtnSx}
          title={theme === "dark" ? "Mode clair" : "Mode sombre"}
          onClick={toggleTheme}
        >
          {theme === "dark" ? (
            <LightModeOutlined sx={{ fontSize: 14 }} />
          ) : (
            <DarkModeOutlined sx={{ fontSize: 14 }} />
          )}
        </Box>

        <Box
          component="button"
          sx={iconBtnSx}
          title="Notifications"
          onClick={() => navigate("/notifications")}
        >
          <NotificationsOutlined sx={{ fontSize: 14 }} />
          {unreadCount > 0 && (
            <Box
              sx={{
                position: "absolute",
                top: -4,
                right: -4,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                background: "var(--red)",
                color: "#fff",
                fontSize: 9,
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: "4px",
                boxSizing: "border-box",
                border: "2px solid var(--s1)",
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Box>
          )}
        </Box>

        <Box ref={menuRef} className="position-relative">
          <Box
            component="button"
            className="d-flex align-items-center gap-2"
            sx={{
              all: "unset",
              cursor: "pointer",
              px: "8px",
              py: "4px",
              pl: "4px",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              background: menuOpen ? "var(--s2)" : "transparent",
              transition: "all 0.12s",
              "&:hover": {
                background: "var(--s2)",
                borderColor: "var(--border2)",
              },
            }}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <Box
              className="d-flex align-items-center justify-content-center flex-shrink-0"
              sx={{
                width: 26,
                height: 26,
                borderRadius: "7px",
                background: "linear-gradient(135deg, var(--accent), #818cf8)",
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                color: "#fff",
                boxShadow: "0 2px 6px rgba(99,102,241,0.35)",
              }}
            >
              {initials}
            </Box>
            {!isMobile && (
              <Box
                component="span"
                className="text-truncate"
                sx={{ fontSize: 12, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", maxWidth: 120 }}
              >
                {user?.firstName}
              </Box>
            )}
            <KeyboardArrowDownOutlined
              sx={{
                fontSize: 12,
                color: "var(--muted)",
                transition: "transform 0.15s",
                transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
                flexShrink: 0,
              }}
            />
          </Box>

          {menuOpen && (
            <Box
              sx={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: 220,
                background: "var(--s1)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                boxShadow: "0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)",
                overflow: "hidden",
                animation: "fadeInUp 0.12s ease forwards",
                zIndex: 100,
              }}
            >
              <Box className="p-3" sx={{ borderBottom: "1px solid var(--border)", background: "var(--s1)" }}>
                <Box sx={{ fontSize: 13, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>
                  {user?.firstName} {user?.lastName}
                </Box>
                <Box className="text-truncate mt-1" sx={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                  {user?.email}
                </Box>
              </Box>
              <Box className="p-1">
                <Box
                  component="button"
                  className="d-flex align-items-center gap-2 w-100"
                  sx={{
                    all: "unset",
                    cursor: "pointer",
                    py: "9px",
                    px: "10px",
                    borderRadius: "7px",
                    fontSize: 13,
                    color: "var(--red)",
                    fontWeight: 500,
                    transition: "background 0.1s",
                    boxSizing: "border-box",
                    "&:hover": { background: "rgba(239,68,68,0.08)" },
                  }}
                  onClick={handleLogout}
                >
                  <LogoutOutlined sx={{ fontSize: 14 }} />
                  Déconnexion
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        {actions && isMobile && (
          <Box className="d-flex align-items-center gap-2">{actions}</Box>
        )}
      </Box>
    </Box>
  );
};
