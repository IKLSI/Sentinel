import type React from "react";
import { Outlet } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import { Header } from "@/components/layout/Sidebar/components/Header";
import { SectionHeader } from "@/components/layout/Sidebar/components/SectionHeader";
import { SectionLink } from "@/components/layout/Sidebar/components/SectionLink";
import {
  ITEM_SX,
  NAV_GROUPS,
  NAV_SECTIONS,
} from "@/components/layout/Sidebar/constants";
import { TEXT_ELLIPSIS_SX } from "@/constants/display";
import {
  DEMO_SIDEBAR_GAP,
  DEMO_SIDEBAR_TOP,
  DEMO_SIDEBAR_WIDTH,
} from "@/features/landing/demo/constants";
import { DEMO_USER_NAMES } from "@/features/landing/demo/fixtures/ids";

const ADMIN_GROUP = "admin";
const NAV_GROUP = "nav";

const PROFILE_INITIALS = DEMO_USER_NAMES.camille
  .split(" ")
  .map((part) => part[0])
  .join("");

const sectionsOf = (groupKey: string) =>
  NAV_SECTIONS.filter((section) => (section.group ?? NAV_GROUP) === groupKey);

const noop = () => {};

export const DemoShell: React.FC = () => {
  const t = useT();

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "var(--bg)",
      }}
    >
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
          boxShadow:
            "var(--sh-2), inset 0 1px 0 color-mix(in srgb, var(--on-dark) 4%, transparent)",
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
              {sectionsOf(group.groupKey).map((section) => {
                if (group.groupKey !== ADMIN_GROUP)
                  return (
                    <SectionLink key={section.titleKey} section={section} />
                  );
                const [item] = section.items;
                const Icon = item.icon;
                return (
                  <Box
                    key={section.titleKey}
                    sx={{ ...ITEM_SX, cursor: "default" }}
                  >
                    <Icon
                      sx={{
                        fontSize: 16,
                        color: "var(--muted)",
                        flexShrink: 0,
                      }}
                    />
                    <Box
                      component="span"
                      sx={{
                        fontSize: "10.5px",
                        fontWeight: 700,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        ...TEXT_ELLIPSIS_SX,
                        color: "var(--muted2)",
                      }}
                    >
                      {t(item.labelKey)}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            flexShrink: 0,
            borderTop: "1px solid var(--border)",
            px: "10px",
            py: "10px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Box
            aria-hidden
            sx={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "var(--accent-subtle)",
              color: "var(--accent)",
              display: "grid",
              placeItems: "center",
              fontSize: "11px",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {PROFILE_INITIALS}
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <Box
              sx={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text)",
                letterSpacing: "-0.01em",
                lineHeight: 1.3,
                ...TEXT_ELLIPSIS_SX,
              }}
            >
              {DEMO_USER_NAMES.camille}
            </Box>
            <Box
              sx={{
                fontSize: "10px",
                fontWeight: 500,
                color: "var(--muted)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                lineHeight: 1.3,
              }}
            >
              {t("sidebar.profile")}
            </Box>
          </Box>
        </Box>
      </Box>
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          height: "100%",
          overflowY: "auto",
          ml: `${DEMO_SIDEBAR_WIDTH + DEMO_SIDEBAR_GAP * 2}px`,
          background: "var(--bg)",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};
