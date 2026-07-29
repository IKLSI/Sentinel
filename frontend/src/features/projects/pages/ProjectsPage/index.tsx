import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  useProjects,
  projectsQueryKey,
  useDeleteProject,
  useScanProject,
  useExportProjectsExcel,
} from "@/features/techHealth/hooks/useProjects";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import AccountTreeOutlined from "@mui/icons-material/AccountTreeOutlined";
import { DeleteModal } from "@/components/DeleteModal";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/i18n/I18nContext";
import {
  getProject,
  type ProjectDto,
} from "@/features/techHealth/api/projects";
import {
  SECTION_ORDER,
  type SectionKey,
  UNTRACKED_SECTION,
  getGrade,
  isUntracked,
  type ProjectSortState,
} from "./helpers";
import { ProjectsToolbar } from "./components/ProjectsToolbar";
import { ProjectsSection } from "./components/ProjectsSection";
import { SyncProjectModal } from "./components/SyncProjectModal";
import { extractApiError } from "@/utils/apiError";

const routeApi = getRouteApi("/_authenticated/projects/");

export const ProjectsPage: React.FC = () => {
  const { showToast } = useToast();
  const t = useT();
  const queryClient = useQueryClient();
  const { openImport } = routeApi.useSearch();
  const { data: projects = [], isLoading: loading } = useProjects();
  const deleteProjectMutation = useDeleteProject();
  const scanProjectMutation = useScanProject();
  const exportProjectsMutation = useExportProjectsExcel();
  const deleting = deleteProjectMutation.isPending;
  const exporting = exportProjectsMutation.isPending;
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ProjectDto | null>(null);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(() => !!openImport);
  const [collapsedSections, setCollapsedSections] = useState<
    Record<SectionKey, boolean>
  >({
    F: false,
    E: false,
    D: false,
    C: false,
    B: false,
    A: false,
    [UNTRACKED_SECTION]: true,
  });
  const [sort, setSort] = useState<ProjectSortState | null>({
    col: "critical",
    dir: "desc",
  });
  const scanPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleSort = useCallback((col: string) => {
    setSort((s) => {
      if (s?.col !== col) return { col, dir: "asc" };
      if (s.dir === "asc") return { col, dir: "desc" };
      return null;
    });
  }, []);

  useEffect(
    () => () => {
      if (scanPollRef.current) clearTimeout(scanPollRef.current);
    },
    [],
  );

  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: projectsQueryKey });
    };
    window.addEventListener("dashboard:refresh", handler);
    return () => window.removeEventListener("dashboard:refresh", handler);
  }, [queryClient]);

  const handleExport = () => {
    exportProjectsMutation.mutate(undefined, {
      onError: () => showToast(t("projects.toast.export_error"), "error"),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteProjectMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        showToast(t("projects.toast.delete_success"), "success");
      },
      onError: (err) =>
        showToast(
          extractApiError(err, t("projects.toast.delete_error")),
          "error",
        ),
    });
  };

  const handleScan = useCallback(
    (id: string) => {
      if (scanningId) return;
      setScanningId(id);
      const previousLastScanAt = queryClient
        .getQueryData<ProjectDto[]>(projectsQueryKey)
        ?.find((p) => p.id === id)?.lastScanAt;
      const deadline = Date.now() + 10 * 60 * 1000;

      const poll = async () => {
        if (Date.now() > deadline) {
          setScanningId(null);
          showToast(t("projects.toast.scan_timeout"), "warning");
          return;
        }
        try {
          const updated = await queryClient.fetchQuery({
            queryKey: ["project", id],
            queryFn: ({ signal }) => getProject(id, signal),
          });
          if (updated.lastScanAt !== previousLastScanAt) {
            queryClient.setQueryData<ProjectDto[]>(projectsQueryKey, (prev) =>
              (prev ?? []).map((p) =>
                p.id === id
                  ? {
                      ...p,
                      healthScore: updated.healthScore,
                      healthGrade: updated.healthGrade,
                      totalDependencies: updated.totalDependencies,
                      vulnerableDependencies: updated.vulnerableDependencies,
                      criticalVulnerabilities: updated.criticalVulnerabilities,
                      totalVulnerabilities: updated.totalVulnerabilities,
                      totalTickets: updated.totalTickets,
                    }
                  : p,
              ),
            );
            setScanningId(null);
            showToast(t("projects.toast.scan_done"), "success");
            window.dispatchEvent(new Event("dashboard:refresh"));
          } else {
            scanPollRef.current = setTimeout(poll, 3000);
          }
        } catch {
          scanPollRef.current = setTimeout(poll, 5000);
        }
      };

      scanProjectMutation.mutate(id, {
        onSuccess: () => {
          showToast(t("projects.toast.scan_started"), "info");
          scanPollRef.current = setTimeout(poll, 2000);
        },
        onError: (err) => {
          showToast(
            extractApiError(err, t("projects.toast.scan_start_error")),
            "error",
          );
          setScanningId(null);
        },
      });
    },
    [scanningId, queryClient, showToast, t, scanProjectMutation],
  );

  const filtered = useMemo(
    () =>
      projects.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [projects, search],
  );

  const grouped = useMemo(() => {
    const map: Record<SectionKey, ProjectDto[]> = {
      F: [],
      E: [],
      D: [],
      C: [],
      B: [],
      A: [],
      [UNTRACKED_SECTION]: [],
    };
    filtered.forEach((project) => {
      const section = isUntracked(project)
        ? UNTRACKED_SECTION
        : getGrade(project.healthGrade);
      map[section].push(project);
    });
    const sortGroup = (arr: ProjectDto[]) =>
      arr.sort((a, b) => {
        if (!sort) return 0;
        const mul = sort.dir === "asc" ? 1 : -1;
        switch (sort.col) {
          case "name":
            return mul * a.name.localeCompare(b.name);
          case "vulnerabilities":
            return (
              mul *
                ((a.totalVulnerabilities ?? 0) -
                  (b.totalVulnerabilities ?? 0)) ||
              (b.criticalVulnerabilities ?? 0) -
                (a.criticalVulnerabilities ?? 0)
            );
          case "critical":
            return (
              mul *
                ((a.criticalVulnerabilities ?? 0) -
                  (b.criticalVulnerabilities ?? 0)) ||
              (b.totalVulnerabilities ?? 0) - (a.totalVulnerabilities ?? 0)
            );
          case "tickets":
            return mul * ((a.totalTickets ?? 0) - (b.totalTickets ?? 0));
          default:
            return 0;
        }
      });
    (Object.keys(map) as SectionKey[]).forEach((grade) => {
      sortGroup(map[grade]);
    });
    return map;
  }, [filtered, sort]);

  const visibleSections = useMemo(
    () => SECTION_ORDER.filter((grade) => grouped[grade].length > 0),
    [grouped],
  );

  return (
    <>
      <Box
        className="page-enter"
        sx={{
          p: "20px 28px",
          height: "100vh",
          maxHeight: "100vh",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <ProjectsToolbar
          search={search}
          onSearchChange={setSearch}
          onImport={() => setShowSyncModal(true)}
          onExport={handleExport}
          exporting={exporting}
        />

        {loading ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
            }}
          >
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflow: "auto",
              pr: "4px",
              pb: "2px",
              "&::-webkit-scrollbar": { width: "6px" },
              "&::-webkit-scrollbar-thumb": {
                background: "var(--border2)",
                borderRadius: "50%",
              },
              "&::-webkit-scrollbar-track": { background: "transparent" },
            }}
          >
            {filtered.length === 0 ? (
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--s1)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r)",
                }}
              >
                <Box className="empty-state">
                  <Box className="empty-state-icon">
                    <AccountTreeOutlined sx={{ fontSize: 40 }} />
                  </Box>
                  <Box className="empty-state-title">
                    {t("projects.empty.title")}
                  </Box>
                  <Box className="empty-state-subtitle">
                    {projects.length === 0
                      ? t("projects.empty.create_first")
                      : t("projects.empty.adjust_search")}
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  minWidth: "1060px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {visibleSections.map((grade) => (
                  <ProjectsSection
                    key={grade}
                    grade={grade}
                    items={grouped[grade]}
                    collapsed={collapsedSections[grade]}
                    onToggleCollapsed={() =>
                      setCollapsedSections((prev) => ({
                        ...prev,
                        [grade]: !prev[grade],
                      }))
                    }
                    sort={sort}
                    onToggleSort={toggleSort}
                    scanningId={scanningId}
                    onDelete={setDeleteTarget}
                    onScan={handleScan}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>

      <SyncProjectModal
        open={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        showToast={showToast}
      />

      <DeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={t("projects.delete.title")}
      >
        {t("projects.delete.prefix")}
        <strong>{deleteTarget?.name}</strong>
        {t("projects.delete.suffix")}
        <br />
        {t("common.action_irreversible_before")}
        <b>{t("common.action_irreversible_word")}</b>
        {t("common.action_irreversible_after")}
      </DeleteModal>
    </>
  );
};
