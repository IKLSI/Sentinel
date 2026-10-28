import type React from "react";
import { useEffect, useMemo, useTransition } from "react";
import { getRouteApi } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import { PageContainer } from "@/components/layout/PageContainer";
import InventoryOutlined from "@mui/icons-material/InventoryOutlined";
import GppBadOutlined from "@mui/icons-material/GppBadOutlined";
import RocketLaunchOutlined from "@mui/icons-material/RocketLaunchOutlined";
import StorageOutlined from "@mui/icons-material/StorageOutlined";
import { useQueryErrorToast } from "@/hooks/useQueryErrorToast";
import { useT } from "@/contexts/I18nContext";
import { ROUTES } from "@/constants/routes";
import { useProjectOverviewQuery } from "@/domains/projects/queries";

import { toVulnerabilityRows } from "@/features/projects/pages/ProjectDetailPage/filters";
import { FindingActionsProvider } from "@/features/projects/pages/ProjectDetailPage/findingActions";
import { ProjectDetailSkeleton } from "@/features/projects/pages/ProjectDetailPage/components/ProjectDetailSkeleton";
import { ProjectHeaderCard } from "@/features/projects/pages/ProjectDetailPage/components/ProjectHeaderCard";
import { ProjectActions } from "@/features/projects/pages/ProjectDetailPage/components/ProjectActions";
import { RemediateAllAction } from "@/features/projects/pages/ProjectDetailPage/components/RemediateAllAction";
import { TabBar, type TabBarItem } from "@/components/ui/common/TabBar";
import { VulnerabilitiesTab } from "@/features/projects/pages/ProjectDetailPage/components/VulnerabilitiesTab";
import { ProjectDependencies } from "@/features/projects/pages/ProjectDetailPage/components/ProjectDependencies";
import { RuntimesTab } from "@/features/projects/pages/ProjectDetailPage/components/RuntimesTab";
import { ProjectTab } from "@/features/projects/pages/ProjectDetailPage/searchParams";
import { DeploymentsTab } from "@/features/deployments/components/DeploymentsTab";

const routeApi = getRouteApi("/_authenticated/projects/$id");

export const ProjectDetailPage: React.FC = () => {
  const { id } = routeApi.useParams();
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const t = useT();

  const [, startTransition] = useTransition();

  const projectQuery = useProjectOverviewQuery(id);
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

  const tabDefs: (TabBarItem & { tab: ProjectTab })[] = [
    {
      tab: ProjectTab.Vulnerabilities,
      icon: <GppBadOutlined sx={{ fontSize: 16 }} />,
      label: t("tech_health.tab.vulnerabilities"),
    },
    {
      tab: ProjectTab.Dependencies,
      icon: <InventoryOutlined sx={{ fontSize: 16 }} />,
      label: t("tech_health.tab.dependencies"),
    },
    {
      tab: ProjectTab.Runtimes,
      icon: <StorageOutlined sx={{ fontSize: 16 }} />,
      label: t("tech_health.tab.runtimes"),
    },
    ...(project.repositoryUrl
      ? [
          {
            tab: ProjectTab.Deployments,
            icon: <RocketLaunchOutlined sx={{ fontSize: 16 }} />,
            label: t("tech_health.tab.deployments"),
          },
        ]
      : []),
  ];
  const activeTab =
    tabDefs.find((def) => def.tab === search.tab)?.tab ??
    ProjectTab.Vulnerabilities;

  return (
    <PageContainer>
      <ProjectHeaderCard
        project={project}
        eolRuntimes={eolRuntimes}
        action={<ProjectActions projectId={project.id} />}
      />

      <TabBar
        tabs={tabDefs}
        active={tabDefs.findIndex((def) => def.tab === activeTab)}
        onChange={(index) => {
          startTransition(() =>
            navigate({
              search: (previous) => ({ ...previous, tab: tabDefs[index]?.tab }),
              replace: true,
            }),
          );
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
          {activeTab === ProjectTab.Vulnerabilities && (
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
          {activeTab === ProjectTab.Dependencies && (
            <ProjectDependencies
              projectId={project.id}
              vulnerableDependencies={project.vulnerableDependencies}
            />
          )}
          {activeTab === ProjectTab.Runtimes && (
            <RuntimesTab runtimes={project.runtimes} />
          )}
          {activeTab === ProjectTab.Deployments && (
            <DeploymentsTab projectId={project.id} />
          )}
        </Box>
      </FindingActionsProvider>
    </PageContainer>
  );
};
