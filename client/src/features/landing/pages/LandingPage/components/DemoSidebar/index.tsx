import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import { Header } from "@/components/layout/Sidebar/components/Header";
import { SectionHeader } from "@/components/layout/Sidebar/components/SectionHeader";
import { SectionLink } from "@/components/layout/Sidebar/components/SectionLink";
import {
  NAV_GROUPS,
  NAV_SECTIONS,
} from "@/components/layout/Sidebar/constants";
import {
  DEMO_SIDEBAR_GAP,
  DEMO_SIDEBAR_TOP,
  DEMO_SIDEBAR_WIDTH,
} from "@/features/landing/demo/constants";
import { DemoNavItem } from "@/features/landing/pages/LandingPage/components/DemoNavItem";
import { DemoProfile } from "@/features/landing/pages/LandingPage/components/DemoProfile";

const ADMIN_GROUP = "admin";
const NAV_GROUP = "nav";

const sectionsOf = (groupKey: string) =>
  NAV_SECTIONS.filter((section) => (section.group ?? NAV_GROUP) === groupKey);

const noop = () => {};

export const DemoSidebar: React.FC = () => {
  const t = useT();

  return (
    <Box
      sx={{
        position: "absolute",
        left: `${DEMO_SIDEBAR_GAP}px`,
        top: `${DEMO_SIDEBAR_TOP}px`,
        bottom: `${DEMO_SIDEBAR_TOP}px`,
        width: `${DEMO_SIDEBAR_WIDTH}px`,
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        background: "var(--s1)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--sh-2), inset 0 1px 0 rgba(255,255,255,0.04)",
        overflow: "hidden",
      }}
    >
      <Header collapsed={false} isMobile onToggleCollapse={noop} />

      <Box
        component="nav"
        sx={{
          flex: 1,
          p: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {NAV_GROUPS.map((group) => (
          <Box
            key={group.groupKey}
            sx={{ display: "flex", flexDirection: "column", gap: "4px" }}
          >
            <SectionHeader
              label={t(group.headerKey)}
              mt={group.groupKey === ADMIN_GROUP ? "12px" : 0}
            />
            {sectionsOf(group.groupKey).map((section) =>
              group.groupKey === ADMIN_GROUP ? (
                <DemoNavItem key={section.titleKey} section={section} />
              ) : (
                <SectionLink key={section.titleKey} section={section} />
              ),
            )}
          </Box>
        ))}
      </Box>

      <DemoProfile />
    </Box>
  );
};
