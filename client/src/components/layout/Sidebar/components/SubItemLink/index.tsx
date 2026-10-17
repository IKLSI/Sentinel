import type React from "react";
import { Link } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import { isItemActive } from "@/components/layout/Sidebar/helpers";
import type { NavItem } from "@/components/layout/Sidebar/types";

interface Props {
  item: NavItem;
  pathname: string;
}

export const SubItemLink: React.FC<Props> = ({ item, pathname }) => {
  const t = useT();
  const active = isItemActive(item, pathname);

  return (
    <Link
      to={item.to}
      activeOptions={{ exact: item.end ?? false }}
      style={{
        textDecoration: "none",
        display: "block",
      }}
    >
      <Box
        sx={{
          height: "30px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          pl: "10px",
          pr: "8px",
          mx: "4px",
          borderRadius: "var(--r-xs)",
          cursor: "pointer",
          "&:hover span.sub-label": !active
            ? { color: "var(--text-secondary)" }
            : {},
        }}
      >
        <Box
          sx={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            flexShrink: 0,
            background: active ? "var(--accent)" : "var(--border2)",
            transition: "background 0.15s",
          }}
        />
        <Box
          component="span"
          className="sub-label"
          sx={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "10px",
            fontWeight: active ? 600 : 400,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: active ? "var(--accent)" : "var(--muted)",
            transition: "color 0.15s",
          }}
        >
          {t(item.labelKey)}
        </Box>
      </Box>
    </Link>
  );
};
