import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import KeyboardArrowDownOutlined from "@mui/icons-material/KeyboardArrowDownOutlined";
import MenuOutlined from "@mui/icons-material/MenuOutlined";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useTheme } from "../store/ThemeContext";
import { useSidebar } from "./SidebarContext";
import { useNotifications } from "../features/notifications/hooks/useNotifications";

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const iconBtn: React.CSSProperties = {
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
};

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
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: 67,
        background: "var(--s1)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: isMobile ? "0 16px" : "0 28px",
        gap: 12,
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="topbar-glow" />

      {isMobile && (
        <button style={iconBtn} onClick={toggle} aria-label="Menu">
          <MenuOutlined sx={{ fontSize: 16 }} />
        </button>
      )}

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: "-0.025em",
            color: "var(--text)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </span>
        {subtitle && !isMobile && (
          <span
            style={{
              fontSize: 13,
              color: "var(--muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              letterSpacing: "-0.01em",
            }}
          >
            {subtitle}
          </span>
        )}
      </div>

      <div
        style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}
      >
        {actions && !isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {actions}
          </div>
        )}

        <button
          style={iconBtn}
          title={theme === "dark" ? "Mode clair" : "Mode sombre"}
          onClick={toggleTheme}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-border)";
            e.currentTarget.style.color = "var(--accent)";
            e.currentTarget.style.background = "var(--accent-subtle)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--muted)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          {theme === "dark" ? (
            <LightModeOutlined sx={{ fontSize: 14 }} />
          ) : (
            <DarkModeOutlined sx={{ fontSize: 14 }} />
          )}
        </button>

        <button
          style={iconBtn}
          title="Notifications"
          onClick={() => navigate("/notifications")}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-border)";
            e.currentTarget.style.color = "var(--accent)";
            e.currentTarget.style.background = "var(--accent-subtle)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--muted)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <NotificationsOutlined sx={{ fontSize: 14 }} />
          {unreadCount > 0 && (
            <div style={{
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
              padding: "0 4px",
              boxSizing: "border-box",
              border: "2px solid var(--s1)",
            }}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </div>
          )}
        </button>

        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            style={{
              all: "unset",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 8px 4px 4px",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              background: menuOpen ? "var(--s2)" : "transparent",
              transition: "all 0.12s",
            }}
            onClick={() => setMenuOpen((v) => !v)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--s2)";
              e.currentTarget.style.borderColor = "var(--border2)";
            }}
            onMouseLeave={(e) => {
              if (!menuOpen) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "var(--border)";
              }
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "7px",
                background: "linear-gradient(135deg, var(--accent), #818cf8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                color: "#fff",
                boxShadow: "0 2px 6px rgba(99,102,241,0.35)",
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            {!isMobile && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text)",
                  letterSpacing: "-0.01em",
                  maxWidth: 120,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.firstName}
              </span>
            )}
            <KeyboardArrowDownOutlined
              sx={{ fontSize: 12 }}
              style={{
                color: "var(--muted)",
                transition: "transform 0.15s",
                transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
                flexShrink: 0,
              }}
            />
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: 220,
                background: "var(--s1)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                boxShadow:
                  "0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)",
                overflow: "hidden",
                animation: "fadeInUp 0.12s ease forwards",
                zIndex: 100,
              }}
            >
              <div
                style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid var(--border)",
                  background: "var(--s1)",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {user?.firstName} {user?.lastName}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    marginTop: 2,
                    fontFamily: "var(--font-mono)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user?.email}
                </div>
              </div>
              <div style={{ padding: "6px" }}>
                <button
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 10px",
                    borderRadius: "7px",
                    fontSize: 13,
                    color: "var(--red)",
                    fontWeight: 500,
                    transition: "background 0.1s",
                    boxSizing: "border-box",
                  }}
                  onClick={handleLogout}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239,68,68,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <LogoutOutlined sx={{ fontSize: 14 }} />
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>

        {actions && isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
