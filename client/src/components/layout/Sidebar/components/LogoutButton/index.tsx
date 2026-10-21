import type React from "react";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import Box from "@mui/material/Box";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { ROUTES } from "@/constants/routes";
import { useT } from "@/contexts/I18nContext";
import { useAuth } from "@/hooks/useAuth";

export const LogoutButton: React.FC = () => {
  const { logout } = useAuth();
  const t = useT();

  const handleLogout = async () => {
    await logout();
    window.location.assign(ROUTES.LOGIN);
  };

  return (
    <AppTooltip title={t("sidebar.logout")}>
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
    </AppTooltip>
  );
};
