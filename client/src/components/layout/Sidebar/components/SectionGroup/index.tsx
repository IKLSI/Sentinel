import type React from "react";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { useT } from "@/contexts/I18nContext";
import { SubItemLink } from "@/components/layout/Sidebar/components/SubItemLink";
import { ITEM_SX } from "@/components/layout/Sidebar/constants";
import { isSectionActive } from "@/components/layout/Sidebar/helpers";
import type { NavSection } from "@/components/layout/Sidebar/types";

interface Props {
  section: NavSection;
  pathname: string;
  isGroupOpen: boolean;
  onToggle: () => void;
}

export const SectionGroup: React.FC<Props> = ({
  section,
  pathname,
  isGroupOpen,
  onToggle,
}) => {
  const t = useT();
  const sectionActive = isSectionActive(section, pathname);
  const GroupIcon = section.icon;

  return (
    <>
      <ButtonBase
        onClick={onToggle}
        sx={{
          font: "inherit",
          textAlign: "inherit",
          ...ITEM_SX,
          justifyContent: "flex-start",
          width: "100%",
          boxSizing: "border-box",
          background:
            sectionActive && !isGroupOpen
              ? "var(--accent-subtle)"
              : "transparent",
          "&:hover": { background: "var(--s3)" },
        }}
      >
        <GroupIcon
          sx={{
            fontSize: 16,
            color: sectionActive ? "var(--accent)" : "var(--muted)",
            flexShrink: 0,
            transition: "color 0.12s",
          }}
        />
        <Box
          component="span"
          sx={{
            flex: 1,
            fontSize: "10.5px",
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: sectionActive ? "var(--accent)" : "var(--muted2)",
            transition: "color 0.15s",
          }}
        >
          {t(section.titleKey)}
        </Box>
        <ChevronRightOutlined
          sx={{
            fontSize: 14,
            color: "var(--muted)",
            flexShrink: 0,
            transform: isGroupOpen ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.18s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </ButtonBase>
      <Box
        sx={{
          overflow: "hidden",
          maxHeight: isGroupOpen ? `${section.items.length * 34}px` : "0px",
          ml: "15px",
          borderLeft: `2px solid ${sectionActive ? "var(--accent-border)" : "var(--border)"}`,
          transition:
            "max-height 0.2s cubic-bezier(0.4,0,0.2,1), border-color 0.2s",
        }}
      >
        {section.items.map((item) => (
          <SubItemLink key={item.to} item={item} pathname={pathname} />
        ))}
      </Box>
    </>
  );
};
