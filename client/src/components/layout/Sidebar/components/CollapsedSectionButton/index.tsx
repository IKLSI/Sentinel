import type React from "react";
import { useNavigate } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { useT } from "@/contexts/I18nContext";
import {
  isItemActive,
  isSectionActive,
} from "@/components/layout/Sidebar/helpers";
import type { NavSection } from "@/components/layout/Sidebar/types";

interface Props {
  section: NavSection;
  pathname: string;
}

export const CollapsedSectionButton: React.FC<Props> = ({
  section,
  pathname,
}) => {
  const navigate = useNavigate();
  const t = useT();

  const sectionActive = isSectionActive(section, pathname);
  const activeItem =
    section.items.find((i) => isItemActive(i, pathname)) ?? section.items[0];
  const ItemIcon = activeItem.icon ?? section.icon;

  return (
    <AppTooltip title={t(section.titleKey)} placement="right">
      <Box
        component="button"
        onClick={() => navigate({ to: activeItem.to })}
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
          background: sectionActive ? "var(--accent-subtle)" : "transparent",
          "&:hover": !sectionActive ? { background: "var(--s3)" } : {},
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
    </AppTooltip>
  );
};
