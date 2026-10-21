import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import { ITEM_SX } from "@/components/layout/Sidebar/constants";
import type { NavSection } from "@/components/layout/Sidebar/types";

interface Props {
  section: NavSection;
}

export const DemoNavItem: React.FC<Props> = ({ section }) => {
  const t = useT();
  const [item] = section.items;
  const Icon = item.icon;

  return (
    <Box sx={{ ...ITEM_SX, cursor: "default" }}>
      <Icon sx={{ fontSize: 16, color: "var(--muted)", flexShrink: 0 }} />
      <Box
        component="span"
        sx={{
          fontSize: "10.5px",
          fontWeight: 700,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          color: "var(--muted2)",
        }}
      >
        {t(item.labelKey)}
      </Box>
    </Box>
  );
};
