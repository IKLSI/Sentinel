import React from "react";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import MenuOutlined from "@mui/icons-material/MenuOutlined";
import Box from "@mui/material/Box";
import { useTheme } from "../store/ThemeContext";
import { useSidebar } from "./SidebarContext";

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
  const { theme, toggleTheme } = useTheme();
  const { isMobile, toggle } = useSidebar();

  return (
    <Box
      className="d-flex align-items-center"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: 67,
        background: "var(--s1)",
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

        {actions && isMobile && (
          <Box className="d-flex align-items-center gap-2">{actions}</Box>
        )}
      </Box>
    </Box>
  );
};
