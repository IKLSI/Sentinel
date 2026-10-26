import type React from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { getRouteApi } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import { PageContainer } from "@/components/layout/PageContainer";
import InventoryOutlined from "@mui/icons-material/InventoryOutlined";
import GppBadOutlined from "@mui/icons-material/GppBadOutlined";
import StorageOutlined from "@mui/icons-material/StorageOutlined";
import { useQueryErrorToast } from "@/hooks/useQueryErrorToast";
import { useT } from "@/contexts/I18nContext";
import { ROUTES } from "@/constants/routes";
import {
  useProjectOverviewQuery,
  useScanProgressQuery,
} from "@/domains/projects/queries";

import { toVulnerabilityRows } from "@/features/techHealth/pages/ProjectDetailPage/filters";
import { FindingActionsProvider } from "@/features/techHealth/pages/ProjectDetailPage/findingActions";
import { ProjectDetailSkeleton } from "@/features/techHealth/pages/ProjectDetailPage/components/ProjectDetailSkeleton";
import { ProjectHeaderCard } from "@/features/techHealth/pages/ProjectDetailPage/components/ProjectHeaderCard";
import { ProjectActions } from "@/features/techHealth/pages/ProjectDetailPage/components/ProjectActions";
import { RemediateAllAction } from "@/features/techHealth/pages/ProjectDetailPage/components/RemediateAllAction";
import { TabBar, type TabBarItem } from "@/components/ui/common/TabBar";
import { VulnerabilitiesTab } from "@/features/techHealth/pages/ProjectDetailPage/components/VulnerabilitiesTab";
import { ProjectDependencies } from "@/features/techHealth/pages/ProjectDetailPage/components/ProjectDependencies";
import { RuntimesTab } from "@/features/techHealth/pages/ProjectDetailPage/components/RuntimesTab";

const routeApi = getRouteApi("/_authenticated/projects/$id");

const TAB_INDEX = { vulnerabilities: 0, dependencies: 1, runtimes: 2 } as const;

export const ProjectDetailPage: React.FC = () => {
  const { id } = routeApi.useParams();
  const navigate = routeApi.useNavigate();
  const t = useT();

  const [activeTab, setActiveTab] = useState<number>(TAB_INDEX.vulnerabilities);
  const [, startTransition] = useTransition();

  const projectQuery = useProjectOverviewQuery(id);
  const { data: scanProgress } = useScanProgressQuery();
  const project = projectQuery.data ?? null;
  const loading = projectQuery.isLoading;
  const error = projectQuery.isError;

  useQueryErrorToast(error, "tech_health.error.load_failed");

  const loadFailed = error && !project;

  useEffect(() => {
    if (loadFailed) navigate({ to: ROUTES.PROJECTS });
  }, [loadFailed, navigate]);

  const allVulns = useMemo(
    () => toVulnerabilityRows(project?.vulnerableDependencies ?? []),
    [project],
  );

  if (loading) return <ProjectDetailSkeleton />;
  if (!project) return null;

  const eolRuntimes = project.runtimes.filter((r) => r.isEol).length;

  const tabDefs: TabBarItem[] = [
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
    <PageContainer>
      <ProjectHeaderCard
        project={project}
        eolRuntimes={eolRuntimes}
        scanProgress={scanProgress?.find(
          (progress) => progress.projectId === project.id,
        )}
        action={<ProjectActions projectId={project.id} />}
      />

      <TabBar
        tabs={tabDefs}
        active={activeTab}
        onChange={(i) => {
          startTransition(() => setActiveTab(i));
        }}
      />

      <FindingActionsProvider projectId={project.id}>
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
              vulns={allVulns}
              toolbarAction={
                <RemediateAllAction
                  projectId={project.id}
                  remediationAvailable={project.remediationAvailable}
                  remediableVulnerabilities={project.remediableVulnerabilities}
                  includesMajorUpgrade={project.remediationIncludesMajorUpgrade}
                  remediation={project.remediation}
                />
              }
            />
          )}
          {activeTab === TAB_INDEX.dependencies && (
            <ProjectDependencies
              projectId={project.id}
              vulnerableDependencies={project.vulnerableDependencies}
            />
          )}
          {activeTab === TAB_INDEX.runtimes && (
            <RuntimesTab runtimes={project.runtimes} />
          )}
        </Box>
      </FindingActionsProvider>
    </PageContainer>
  );
};
