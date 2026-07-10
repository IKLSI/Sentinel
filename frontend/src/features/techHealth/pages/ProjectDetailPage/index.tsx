import type React from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import InventoryOutlined from "@mui/icons-material/InventoryOutlined";
import GppBadOutlined from "@mui/icons-material/GppBadOutlined";
import StorageOutlined from "@mui/icons-material/StorageOutlined";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/i18n/I18nContext";
import { ROUTES } from "@/constants/routes";
import { useProject } from "@/features/techHealth/hooks/useProject";
import type { TabDef } from "./helpers";
import { ProjectDetailSkeleton } from "./components/ProjectDetailSkeleton";
import { ProjectHeaderCard } from "./components/ProjectHeaderCard";
import { RemediateButton } from "./components/RemediateButton";
import { TabBar } from "./components/TabBar";
import { VulnerabilitiesTab } from "./components/VulnerabilitiesTab";
import { DependenciesTab } from "./components/DependenciesTab";
import { RuntimesTab } from "./components/RuntimesTab";

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const t = useT();

  const [activeTab, setActiveTab] = useState(0);
  const [depSearch, setDepSearch] = useState("");
  const [, startTransition] = useTransition();

  const { project, loading, error } = useProject(id);

  useEffect(() => {
    if (!error) return;
    showToast(t("tech_health.error.load_failed"), "error");
    navigate(ROUTES.PROJECTS);
  }, [error, showToast, navigate, t]);

  const allVulns = useMemo(
    () =>
      project?.dependencies.flatMap((d) =>
        d.vulnerabilities.map((v) => ({ ...v, dependencyName: d.name })),
      ) ?? [],
    [project],
  );

  const sortedVulns = useMemo(
    () => allVulns.slice().sort((a, b) => b.cvssScore - a.cvssScore),
    [allVulns],
  );

  const filteredDeps = useMemo(() => {
    if (!project) return [];
    const deps = depSearch
      ? project.dependencies.filter((d) =>
          d.name.toLowerCase().includes(depSearch.toLowerCase()),
        )
      : [...project.dependencies];
    return deps.sort(
      (a, b) => b.vulnerabilities.length - a.vulnerabilities.length,
    );
  }, [project, depSearch]);

  const eolRuntimes = useMemo(
    () => project?.runtimes.filter((r) => r.isEol).length ?? 0,
    [project],
  );

  if (loading) return <ProjectDetailSkeleton />;
  if (!project) return null;

  const vulnAccent = allVulns.some((v) => v.severity === "Critical")
    ? "var(--red)"
    : allVulns.some((v) => v.severity === "High")
      ? "var(--orange)"
      : undefined;

  const runtimeAccent = project.runtimes.some((r) => r.isEol)
    ? "var(--red)"
    : undefined;

  const tabDefs: TabDef[] = [
    {
      icon: <GppBadOutlined sx={{ fontSize: 14 }} />,
      label: t("tech_health.tab.vulnerabilities"),
      count: allVulns.length,
      accentColor: vulnAccent,
    },
    {
      icon: <InventoryOutlined sx={{ fontSize: 14 }} />,
      label: t("tech_health.tab.dependencies"),
      count: project.dependencies.length,
    },
    {
      icon: <StorageOutlined sx={{ fontSize: 14 }} />,
      label: t("tech_health.tab.runtimes"),
      count: project.runtimes.length,
      accentColor: runtimeAccent,
    },
  ];

  return (
    <Box
      className="page-enter"
      sx={{
        p: "20px 28px",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <ProjectHeaderCard
        project={project}
        eolRuntimes={eolRuntimes}
        action={
          project.totalVulnerabilities > 0 ? (
            <RemediateButton projectId={project.id} />
          ) : undefined
        }
      />

      <Box
        sx={{
          flex: "1 1 auto",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          background: "var(--s1)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
            height: "44px",
            display: "flex",
            alignItems: "stretch",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--border)",
            background: "var(--s2)",
            px: "4px",
          }}
        >
          <TabBar
            tabs={tabDefs}
            active={activeTab}
            onChange={(i) => {
              startTransition(() => {
                setActiveTab(i);
                setDepSearch("");
              });
            }}
          />
        </Box>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            p: "20px",
          }}
        >
          {activeTab === 0 && <VulnerabilitiesTab vulns={sortedVulns} />}
          {activeTab === 1 && (
            <DependenciesTab
              dependencies={project.dependencies}
              filteredDeps={filteredDeps}
              search={depSearch}
              onSearchChange={setDepSearch}
            />
          )}
          {activeTab === 2 && <RuntimesTab runtimes={project.runtimes} />}
        </Box>
      </Box>
    </Box>
  );
};
