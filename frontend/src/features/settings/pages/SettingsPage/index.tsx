import React, { useContext, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import PeopleOutlined from "@mui/icons-material/PeopleOutlined";
import BusinessOutlined from "@mui/icons-material/BusinessOutlined";
import TerminalOutlined from "@mui/icons-material/TerminalOutlined";
import CreditCardOutlined from "@mui/icons-material/CreditCardOutlined";
import { useT } from "@/i18n/I18nContext";
import { AuthContext } from "@/features/auth/context/AuthContext";
import { Tab } from "./helpers";
import { MembersTab } from "./components/MembersTab";
import { OrganisationTab } from "./components/OrganisationTab";
import { JobsTab } from "./components/JobsTab";
import { BillingTab } from "./components/BillingTab";
import { InviteModal } from "./components/InviteModal";
import { SETTINGS_OPEN_INVITE_EVENT } from "@/components/CommandPalette";

export const SettingsPage: React.FC = () => {
  const t = useT();
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === "Admin";

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = useMemo(
    () => [
      {
        id: "organisation",
        label: t("settings.tab.organisation"),
        icon: BusinessOutlined,
      },
      { id: "members", label: t("settings.tab.members"), icon: PeopleOutlined },
      ...(isAdmin
        ? [
            { id: "jobs" as Tab, label: t("settings.tab.jobs"), icon: TerminalOutlined },
            { id: "billing" as Tab, label: t("settings.tab.billing"), icon: CreditCardOutlined },
          ]
        : []),
    ],
    [t, isAdmin],
  );

  const [activeTab, setActiveTab] = useState<Tab>("organisation");
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    const handler = () => { setActiveTab("members"); setInviteOpen(true); };
    window.addEventListener(SETTINGS_OPEN_INVITE_EVENT, handler);
    return () => window.removeEventListener(SETTINGS_OPEN_INVITE_EVENT, handler);
  }, []);

  return (
    <>
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
                    "&:hover": !active
                      ? { color: "var(--text-secondary)" }
                      : {},
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
          <Box sx={{ display: activeTab === "members" ? "contents" : "none" }}>
            <MembersTab onInviteClick={() => setInviteOpen(true)} />
          </Box>

          {activeTab === "organisation" && <OrganisationTab />}
          {activeTab === "jobs" && <JobsTab />}
          {activeTab === "billing" && <BillingTab />}
        </Box>
      </Box>

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
};
