import type React from "react";
import { Link } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import { ITEM_SX } from "@/components/layout/Sidebar/constants";
import type { NavSection } from "@/components/layout/Sidebar/types";
import { TEXT_ELLIPSIS_SX } from "@/constants/display";

interface Props {
  section: NavSection;
}

export const SectionLink: React.FC<Props> = ({ section }) => {
  const t = useT();
  const [item] = section.items;
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      activeOptions={{
        exact: item.end ?? false,
      }}
      style={{ textDecoration: "none", display: "block" }}
    >
      {({ isActive }) => (
        <Box
          sx={{
            ...ITEM_SX,
            background: isActive ? "var(--accent-subtle)" : "transparent",
            "&:hover": !isActive ? { background: "var(--s3)" } : {},
          }}
        >
          <Icon
            sx={{
              fontSize: 16,
              color: isActive ? "var(--accent)" : "var(--muted)",
              flexShrink: 0,
              transition: "color 0.12s",
            }}
          />
          <Box
            component="span"
            sx={{
              typography: "label",
              ...TEXT_ELLIPSIS_SX,
              color: isActive ? "var(--accent)" : "var(--muted2)",
              transition: "color 0.15s",
            }}
          >
            {t(item.labelKey)}
          </Box>
        </Box>
      )}
    </Link>
  );
};
