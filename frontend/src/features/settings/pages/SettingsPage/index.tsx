import type React from "react";
import { useContext, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import TerminalOutlined from "@mui/icons-material/TerminalOutlined";
import CreditCardOutlined from "@mui/icons-material/CreditCardOutlined";
import KeyOutlined from "@mui/icons-material/KeyOutlined";
import { useT } from "@/contexts/I18nContext";
import { AuthContext } from "@/contexts/AuthContext";
import { UserRole } from "@/enums";
import {
  type Tab,
  SettingsTab,
} from "@/features/settings/pages/SettingsPage/helpers";
import { JobsTab } from "@/features/settings/pages/SettingsPage/components/JobsTab";
import { BillingTab } from "@/features/settings/pages/SettingsPage/components/BillingTab";
import { ApiKeysTab } from "@/features/settings/pages/SettingsPage/components/ApiKeysTab";

export const SettingsPage: React.FC = () => {
  const t = useT();
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === UserRole.Admin;

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = useMemo(
    () =>
      isAdmin
        ? [
            {
              id: SettingsTab.Billing,
              label: t("settings.tab.billing"),
              icon: CreditCardOutlined,
            },
            {
              id: SettingsTab.Jobs,
              label: t("settings.tab.jobs"),
              icon: TerminalOutlined,
            },
            {
              id: SettingsTab.ApiKeys,
              label: t("settings.tab.api_keys"),
              icon: KeyOutlined,
            },
          ]
        : [],
    [t, isAdmin],
  );

  const [activeTab, setActiveTab] = useState<Tab>(SettingsTab.Billing);

  return (
    <Box
      className="page-enter"
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <Box sx={{ px: "28px", pt: "20px", pb: 0, flexShrink: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <Box
                key={tab.id}
                component="button"
                onClick={() => setActiveTab(tab.id)}
                sx={{
                  all: "unset",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  px: "14px",
                  pb: "11px",
                  pt: "2px",
                  fontSize: "13px",
                  fontWeight: active ? 600 : 450,
                  color: active ? "var(--text)" : "var(--muted)",
                  position: "relative",
                  transition: "color 0.12s",
                  "&:hover": !active ? { color: "var(--text-secondary)" } : {},
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    bottom: -1,
                    left: 0,
                    right: 0,
                    height: "2px",
                    borderRadius: "2px 2px 0 0",
                    background: active ? "var(--accent)" : "transparent",
                    transition: "background 0.15s",
                  },
                }}
              >
                <Icon
                  sx={{
                    fontSize: 14,
                    color: active ? "var(--accent)" : "inherit",
                    transition: "color 0.12s",
                  }}
                />
                {tab.label}
              </Box>
            );
          })}
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          p: "20px 28px",
        }}
      >
        {activeTab === SettingsTab.Jobs && <JobsTab />}
        {activeTab === SettingsTab.Billing && <BillingTab />}
        {activeTab === SettingsTab.ApiKeys && <ApiKeysTab />}
      </Box>
    </Box>
  );
};
