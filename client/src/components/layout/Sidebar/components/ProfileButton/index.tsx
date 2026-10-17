import type React from "react";
import { useNavigate } from "@tanstack/react-router";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import Box from "@mui/material/Box";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { ROUTES } from "@/constants/routes";
import { useT } from "@/contexts/I18nContext";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  collapsed: boolean;
}

export const ProfileButton: React.FC<Props> = ({ collapsed }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const t = useT();

  return (
    <AppTooltip
      title={collapsed ? `${user?.firstName} ${user?.lastName?.[0]}.` : ""}
    >
      <Box
        component="button"
        onClick={() => navigate({ to: ROUTES.PROFILE })}
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
          "&:hover": {
            opacity: 0.7,
            "& .profile-name": { color: "var(--accent)" },
          },
        }}
      >
        <Box
          sx={{
            width: collapsed ? 24 : 30,
            height: collapsed ? 24 : 30,
            borderRadius: "50%",
            background: "var(--s3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--muted)",
            flexShrink: 0,
          }}
        >
          <PersonOutlined sx={{ fontSize: collapsed ? 14 : 18 }} />
        </Box>
        {!collapsed && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              minWidth: 0,
            }}
          >
            <Box
              className="profile-name"
              sx={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text)",
                letterSpacing: "-0.01em",
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                transition: "color 0.12s",
              }}
            >
              {user?.firstName} {user?.lastName?.[0]}.
            </Box>
            <Box
              sx={{
                fontSize: "10px",
                fontWeight: 500,
                color: "var(--muted)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                transition: "color 0.12s",
              }}
            >
              {t("sidebar.profile")}
            </Box>
          </Box>
        )}
      </Box>
    </AppTooltip>
  );
};
