import type React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import { PageContainer } from "@/components/layout/PageContainer";
import { TabBar, type TabBarItem } from "@/components/ui/common/TabBar";
import TerminalOutlined from "@mui/icons-material/TerminalOutlined";
import KeyOutlined from "@mui/icons-material/KeyOutlined";
import { useT } from "@/contexts/I18nContext";
import { SettingsTab } from "@/enums";
import { JobsTab } from "@/features/settings/pages/SettingsPage/components/JobsTab";
import { ApiKeysTab } from "@/features/settings/pages/SettingsPage/components/ApiKeysTab";

export const SettingsPage: React.FC = () => {
  const t = useT();

  const tabs: (TabBarItem & { id: SettingsTab })[] = [
    {
      id: SettingsTab.Jobs,
      label: t("settings.tab.jobs"),
      icon: <TerminalOutlined sx={{ fontSize: 16 }} />,
    },
    {
      id: SettingsTab.ApiKeys,
      label: t("settings.tab.api_keys"),
      icon: <KeyOutlined sx={{ fontSize: 16 }} />,
    },
  ];

  const [activeTab, setActiveTab] = useState<SettingsTab>(SettingsTab.Jobs);

  return (
    <PageContainer sx={{ p: 0 }}>
      <Box sx={{ px: "28px", pt: "20px", pb: 0, flexShrink: 0 }}>
        <TabBar
          tabs={tabs}
          active={tabs.findIndex((tab) => tab.id === activeTab)}
          onChange={(index) => setActiveTab(tabs[index].id)}
        />
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
        {activeTab === SettingsTab.ApiKeys && <ApiKeysTab />}
      </Box>
    </PageContainer>
  );
};
