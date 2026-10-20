import type React from "react";
import MenuOutlined from "@mui/icons-material/MenuOutlined";
import IconButton from "@mui/material/IconButton";
import { useSidebar } from "@/contexts/SidebarContext";
import { useT } from "@/contexts/I18nContext";

export const MobileMenuButton: React.FC = () => {
  const { isMobile, isOpen, toggle } = useSidebar();
  const t = useT();

  if (!isMobile || isOpen) return null;

  return (
    <IconButton
      aria-label={t("sidebar.open_menu")}
      aria-expanded={isOpen}
      onClick={toggle}
      sx={{
        position: "fixed",
        top: "10px",
        left: "10px",
        zIndex: 150,
        background: "var(--s1)",
        border: "1px solid var(--border)",
        boxShadow: "var(--sh-2)",
        "&:hover": { background: "var(--s3)" },
      }}
    >
      <MenuOutlined />
    </IconButton>
  );
};
