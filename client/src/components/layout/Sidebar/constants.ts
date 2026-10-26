import AccountTreeOutlined from "@mui/icons-material/AccountTreeOutlined";
import BusinessOutlined from "@mui/icons-material/BusinessOutlined";
import ConfirmationNumberOutlined from "@mui/icons-material/ConfirmationNumberOutlined";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import { ROUTES } from "@/constants/routes";
import type { NavGroup, NavSection } from "@/components/layout/Sidebar/types";

export const NAV_SECTIONS: NavSection[] = [
  {
    titleKey: "sidebar.section.dashboard",
    items: [
      {
        to: ROUTES.DASHBOARD,
        icon: DashboardOutlined,
        labelKey: "sidebar.item.dashboard",
        end: true,
      },
    ],
  },
  {
    titleKey: "sidebar.section.tickets",
    items: [
      {
        to: ROUTES.TICKETS,
        icon: ConfirmationNumberOutlined,
        labelKey: "sidebar.section.tickets",
        activeFor: /^\/tickets(\/.+)?$/,
      },
    ],
  },
  {
    titleKey: "sidebar.section.projects",
    items: [
      {
        to: ROUTES.PROJECTS,
        icon: AccountTreeOutlined,
        labelKey: "sidebar.item.projects",
      },
    ],
  },
  {
    titleKey: "sidebar.item.organisation",
    adminOnly: true,
    group: "admin",
    items: [
      {
        to: ROUTES.ORGANISATION,
        icon: BusinessOutlined,
        labelKey: "sidebar.item.organisation",
      },
    ],
  },
  {
    titleKey: "sidebar.section.users",
    adminOnly: true,
    group: "admin",
    items: [
      {
        to: ROUTES.USERS,
        icon: PersonOutlined,
        labelKey: "sidebar.item.users",
      },
    ],
  },
  {
    titleKey: "sidebar.item.settings",
    adminOnly: true,
    group: "admin",
    items: [
      {
        to: ROUTES.SETTINGS,
        icon: SettingsOutlined,
        labelKey: "sidebar.item.settings",
      },
    ],
  },
];

export const NAV_GROUPS: NavGroup[] = [
  { groupKey: "nav", headerKey: "sidebar.section.nav" },
  { groupKey: "admin", headerKey: "sidebar.section.administration" },
];

export const ITEM_SX = {
  height: "34px",
  display: "flex",
  alignItems: "center",
  gap: "9px",
  px: "10px",
  borderRadius: "var(--r)",
  cursor: "pointer",
  transition: "background 0.12s, color 0.12s",
  userSelect: "none",
} as const;
