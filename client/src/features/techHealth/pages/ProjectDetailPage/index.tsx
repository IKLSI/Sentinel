import type React from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { getRouteApi } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import { PageContainer } from "@/components/layout/PageContainer";
import InventoryOutlined from "@mui/icons-material/InventoryOutlined";
import GppBadOutlined from "@mui/icons-material/GppBadOutlined";
import StorageOutlined from "@mui/icons-material/StorageOutlined";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/contexts/I18nContext";
import { ROUTES } from "@/constants/routes";
import { useProjectQuery } from "@/domains/projects/queries";
import type { TabDef } from "@/features/techHealth/pages/ProjectDetailPage/helpers";
import { ProjectDetailSkeleton } from "@/features/techHealth/pages/ProjectDetailPage/components/ProjectDetailSkeleton";
import { ProjectHeaderCard } from "@/features/techHealth/pages/ProjectDetailPage/components/ProjectHeaderCard";
import { ExportActions } from "@/features/techHealth/pages/ProjectDetailPage/components/ExportActions";
import { TabBar } from "@/features/techHealth/pages/ProjectDetailPage/components/TabBar";
import { VulnerabilitiesTab } from "@/features/techHealth/pages/ProjectDetailPage/components/VulnerabilitiesTab";
import { DependenciesTab } from "@/features/techHealth/pages/ProjectDetailPage/components/DependenciesTab";
import { RuntimesTab } from "@/features/techHealth/pages/ProjectDetailPage/components/RuntimesTab";

const routeApi = getRouteApi("/_authenticated/projects/$id");

const TAB_INDEX = { vulnerabilities: 0, dependencies: 1, runtimes: 2 } as const;

export const ProjectDetailPage: React.FC = () => {
  const { id } = routeApi.useParams();
  const navigate = routeApi.useNavigate();
  const { showToast } = useToast();
  const t = useT();

  const [activeTab, setActiveTab] = useState<number>(TAB_INDEX.vulnerabilities);
  const [, startTransition] = useTransition();

  const projectQuery = useProjectQuery(id);
  const project = projectQuery.data ?? null;
  const loading = projectQuery.isLoading;
  const error = projectQuery.isError;

  useEffect(() => {
    if (!error) return;
    showToast(t("tech_health.error.load_failed"), "error");
    navigate({ to: ROUTES.PROJECTS });
  }, [error, showToast, navigate, t]);

  const allVulns = useMemo(
    () =>
      project?.dependencies.flatMap((d) =>
        d.vulnerabilities.map((v) => ({
          ...v,
          dependencyName: d.name,
          dependencyType: d.type,
        })),
      ) ?? [],
    [project],
  );

  const eolRuntimes = useMemo(
    () => project?.runtimes.filter((r) => r.isEol).length ?? 0,
    [project],
  );

  if (loading) return <ProjectDetailSkeleton />;
  if (!project) return null;

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
    <PageContainer>
      <ProjectHeaderCard
        project={project}
        eolRuntimes={eolRuntimes}
        action={<ExportActions projectId={project.id} />}
      />

      <TabBar
        tabs={tabDefs}
        active={activeTab}
        onChange={(i) => {
          startTransition(() => setActiveTab(i));
        }}
      />

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
          <VulnerabilitiesTab projectId={project.id} vulns={allVulns} />
        )}
        {activeTab === TAB_INDEX.dependencies && (
          <DependenciesTab
            projectId={project.id}
            dependencies={project.dependencies}
          />
        )}
        {activeTab === TAB_INDEX.runtimes && (
          <RuntimesTab projectId={project.id} runtimes={project.runtimes} />
        )}
      </Box>
    </PageContainer>
  );
};
