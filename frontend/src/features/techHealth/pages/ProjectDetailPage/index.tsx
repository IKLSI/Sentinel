import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import InventoryOutlined from "@mui/icons-material/InventoryOutlined";
import GppBadOutlined from "@mui/icons-material/GppBadOutlined";
import StorageOutlined from "@mui/icons-material/StorageOutlined";
import { DeleteModal } from "@/components/DeleteModal";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/i18n/I18nContext";
import {
  ProjectDetailDto,
  deleteProject,
  getProject,
} from "@/features/techHealth/api/projects";
import { TabDef } from "./helpers";
import { ProjectDetailSkeleton } from "./components/ProjectDetailSkeleton";
import { ProjectHeaderCard } from "./components/ProjectHeaderCard";
import { TabBar } from "./components/TabBar";
import { VulnerabilitiesTab } from "./components/VulnerabilitiesTab";
import { DependenciesTab } from "./components/DependenciesTab";
import { RuntimesTab } from "./components/RuntimesTab";
import { extractApiError } from "@/utils/apiError";

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const t = useT();

  const [project, setProject] = useState<ProjectDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [depSearch, setDepSearch] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getProject(id, signal);
      if (signal?.aborted) return;
      setProject(data);
    } catch {
      if (signal?.aborted) return;
      showToast(t("tech_health.error.load_failed"), "error");
      navigate("/projects");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [id, showToast, navigate, t]);

  useEffect(() => {
    const ctrl = new AbortController();
    void load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteProject(id);
      showToast(t("tech_health.toast.deleted"), "success");
      navigate("/projects");
    } catch (err) {
      showToast(extractApiError(err, t("tech_health.toast.delete_error")), "error");
      setDeleting(false);
    }
  };

  const allVulns = useMemo(
    () => project?.dependencies.flatMap((d) => d.vulnerabilities.map((v) => ({ ...v, dependencyName: d.name }))) ?? [],
    [project],
  );

  const sortedVulns = useMemo(
    () => allVulns.slice().sort((a, b) => b.cvssScore - a.cvssScore),
    [allVulns],
  );

  const filteredDeps = useMemo(() => {
    if (!project) return [];
    if (!depSearch) return project.dependencies;
    return project.dependencies.filter((d) =>
      d.name.toLowerCase().includes(depSearch.toLowerCase()),
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
    <>
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
        />

        <Box
          sx={{
            flex: "0 1 auto",
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
                setActiveTab(i);
                setDepSearch("");
              }}
            />
          </Box>

          <Box
            key={activeTab}
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              p: "20px",
              animation: "tabIn 0.18s cubic-bezier(0.4,0,0.2,1) both",
              "@keyframes tabIn": {
                from: { opacity: 0, transform: "translateY(6px)" },
                to: { opacity: 1, transform: "translateY(0)" },
              },
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

      <DeleteModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title={t("tech_health.delete.title")}
      >
        {t("tech_health.delete.prefix")}<strong>{project.name}</strong>{t("tech_health.delete.suffix")}<br />{t("common.action_irreversible_before")}<b>{t("common.action_irreversible_word")}</b>{t("common.action_irreversible_after")}
      </DeleteModal>
    </>
  );
};
