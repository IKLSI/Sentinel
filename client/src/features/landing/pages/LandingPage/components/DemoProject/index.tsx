import type React from "react";
import { useMemo, useState } from "react";
import { useParams } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import GppBadOutlined from "@mui/icons-material/GppBadOutlined";
import InventoryOutlined from "@mui/icons-material/InventoryOutlined";
import StorageOutlined from "@mui/icons-material/StorageOutlined";
import { PageContainer } from "@/components/layout/PageContainer";
import { useT } from "@/contexts/I18nContext";
import { findDemoProject } from "@/features/landing/demo/fixtures/projects";
import { DemoFindingActions } from "@/features/landing/pages/LandingPage/components/DemoFindingActions";
import { toVulnerabilityRows } from "@/features/techHealth/pages/ProjectDetailPage/filters";
import type { TabDef } from "@/features/techHealth/pages/ProjectDetailPage/helpers";
import { DependenciesTab } from "@/features/techHealth/pages/ProjectDetailPage/components/DependenciesTab";
import { ProjectHeaderCard } from "@/features/techHealth/pages/ProjectDetailPage/components/ProjectHeaderCard";
import { RuntimesTab } from "@/features/techHealth/pages/ProjectDetailPage/components/RuntimesTab";
import { TabBar } from "@/features/techHealth/pages/ProjectDetailPage/components/TabBar";
import { VulnerabilitiesTab } from "@/features/techHealth/pages/ProjectDetailPage/components/VulnerabilitiesTab";

const TAB_INDEX = { vulnerabilities: 0, dependencies: 1, runtimes: 2 } as const;

export const DemoProject: React.FC = () => {
  const t = useT();
  const { id } = useParams({ strict: false });
  const project = findDemoProject(id);
  const [activeTab, setActiveTab] = useState<number>(TAB_INDEX.vulnerabilities);

  const vulnerabilities = useMemo(
    () => toVulnerabilityRows(project.dependencies),
    [project],
  );
  const eolRuntimes = project.runtimes.filter((r) => r.isEol).length;

  const tabDefs: TabDef[] = [
    {
      icon: <GppBadOutlined sx={{ fontSize: 16 }} />,
      label: t("tech_health.tab.vulnerabilities"),
    },
    {
      icon: <InventoryOutlined sx={{ fontSize: 16 }} />,
      label: t("tech_health.tab.dependencies"),
    },
    {
      icon: <StorageOutlined sx={{ fontSize: 16 }} />,
      label: t("tech_health.tab.runtimes"),
    },
  ];

  return (
    <PageContainer sx={{ height: "100%", boxSizing: "border-box" }}>
      <ProjectHeaderCard project={project} eolRuntimes={eolRuntimes} />

      <TabBar tabs={tabDefs} active={activeTab} onChange={setActiveTab} />

      <DemoFindingActions>
        <Box
          sx={{
            flex: "1 1 auto",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            pt: "20px",
          }}
        >
          {activeTab === TAB_INDEX.vulnerabilities && (
            <VulnerabilitiesTab
              projectId={project.id}
              vulns={vulnerabilities}
            />
          )}
          {activeTab === TAB_INDEX.dependencies && (
            <DependenciesTab dependencies={project.dependencies} />
          )}
          {activeTab === TAB_INDEX.runtimes && (
            <RuntimesTab runtimes={project.runtimes} />
          )}
        </Box>
      </DemoFindingActions>
    </PageContainer>
  );
};
