import type React from "react";
import KeyboardDoubleArrowLeftOutlined from "@mui/icons-material/KeyboardDoubleArrowLeftOutlined";
import Box from "@mui/material/Box";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { SentinelLogo } from "@/components/layout/SentinelLogo";
import { SentinelWordmark } from "@/components/layout/SentinelWordmark";
import { useT } from "@/contexts/I18nContext";

interface Props {
  collapsed: boolean;
  isMobile: boolean;
  onToggleCollapse: () => void;
}

export const Header: React.FC<Props> = ({
  collapsed,
  isMobile,
  onToggleCollapse,
}) => {
  const t = useT();

  if (collapsed && !isMobile) {
    return (
      <AppTooltip title={t("sidebar.expand")}>
        <Box
          component="button"
          onClick={onToggleCollapse}
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
      </AppTooltip>
    );
  }

  return (
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
        <Box sx={{ color: "var(--text)" }}>
          <SentinelWordmark height={20} />
        </Box>
      </Box>

      {!isMobile && (
        <AppTooltip title={t("sidebar.collapse")}>
          <Box
            component="button"
            onClick={onToggleCollapse}
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
        </AppTooltip>
      )}
    </Box>
  );
};
