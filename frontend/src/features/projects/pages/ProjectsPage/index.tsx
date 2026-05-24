import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { projectsQueryKey } from "@/features/techHealth/hooks/useProjects";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import AccountTreeOutlined from "@mui/icons-material/AccountTreeOutlined";
import { DeleteModal } from "@/components/DeleteModal";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/i18n/I18nContext";
import {
  getProjects,
  getProject,
  deleteProject,
  scanProject,
  exportProjectsExcel,
  ProjectDto,
} from "@/features/techHealth/api/projects";
import { GRADE_ORDER, GradeKey, getGrade } from "./helpers";
import { ProjectsToolbar } from "./components/ProjectsToolbar";
import { ProjectsSection } from "./components/ProjectsSection";
import { SyncProjectModal } from "./components/SyncProjectModal";
import { extractApiError } from "@/utils/apiError";
import { PROJECTS_OPEN_IMPORT_EVENT } from "@/components/CommandPalette";

export const ProjectsPage: React.FC = () => {
  const { showToast } = useToast();
  const t = useT();
  const queryClient = useQueryClient();
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ProjectDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<
    Record<GradeKey, boolean>
  >({
    F: false,
    E: false,
    D: false,
    C: false,
    B: false,
    A: false,
  });
  const scanPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (scanPollRef.current) clearTimeout(scanPollRef.current);
    },
    [],
  );

  useEffect(() => {
    const handler = () => setShowSyncModal(true);
    window.addEventListener(PROJECTS_OPEN_IMPORT_EVENT, handler);
    return () => window.removeEventListener(PROJECTS_OPEN_IMPORT_EVENT, handler);
  }, []);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const data = await getProjects(signal);
      if (signal?.aborted) return;
      setProjects(data);
    } catch {
      if (signal?.aborted) return;
      showToast(t("projects.toast.load_error"), "error");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    const ctrl = new AbortController();
    void load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportProjectsExcel();
    } catch {
      showToast(t("projects.toast.export_error"), "error");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProject(deleteTarget.id);
      setDeleteTarget(null);
      showToast(t("projects.toast.delete_success"), "success");
      await load();
    } catch (err) {
      showToast(extractApiError(err, t("projects.toast.delete_error")), "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleScan = async (id: string) => {
    if (scanningId) return;
    setScanningId(id);
    const previousLastScanAt = projects.find((p) => p.id === id)?.lastScanAt;
    const deadline = Date.now() + 10 * 60 * 1000;
    try {
      await scanProject(id);
      showToast(t("projects.toast.scan_started"), "info");
      const poll = async () => {
        if (Date.now() > deadline) {
          setScanningId(null);
          showToast(t("projects.toast.scan_timeout"), "warning");
          return;
        }
        try {
          const updated = await getProject(id);
          if (updated.lastScanAt !== previousLastScanAt) {
            setProjects((prev) =>
              prev.map((p) =>
                p.id === id
                  ? {
                      ...p,
                      healthScore: updated.healthScore,
                      healthGrade: updated.healthGrade,
                      totalDependencies: updated.totalDependencies,
                      vulnerableDependencies: updated.vulnerableDependencies,
                      criticalVulnerabilities: updated.criticalVulnerabilities,
                    }
                  : p,
              ),
            );
            setScanningId(null);
            showToast(t("projects.toast.scan_done"), "success");
            void queryClient.invalidateQueries({ queryKey: projectsQueryKey });
          } else {
            scanPollRef.current = setTimeout(poll, 3000);
          }
        } catch {
          scanPollRef.current = setTimeout(poll, 5000);
        }
      };
      scanPollRef.current = setTimeout(poll, 2000);
    } catch (err) {
      showToast(extractApiError(err, t("projects.toast.scan_start_error")), "error");
      setScanningId(null);
    }
  };

  const filtered = useMemo(
    () =>
      projects.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [projects, search],
  );

  const grouped = useMemo(() => {
    const map: Record<GradeKey, ProjectDto[]> = {
      F: [],
      E: [],
      D: [],
      C: [],
      B: [],
      A: [],
    };
    filtered.forEach((project) => {
      map[getGrade(project.healthGrade)].push(project);
    });
    const sortGroup = (arr: ProjectDto[]) =>
      arr.sort((a, b) =>
        (b.criticalVulnerabilities ?? 0) - (a.criticalVulnerabilities ?? 0) ||
        (b.totalVulnerabilities ?? 0) - (a.totalVulnerabilities ?? 0) ||
        (b.totalDependencies ?? 0) - (a.totalDependencies ?? 0)
      );
    (Object.keys(map) as GradeKey[]).forEach((grade) => sortGroup(map[grade]));
    return map;
  }, [filtered]);

  const visibleSections = useMemo(
    () => GRADE_ORDER.filter((grade) => grouped[grade].length > 0),
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
                borderRadius: '50%',
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
        onImported={() => void load()}
        showToast={showToast}
      />

      <DeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={t("projects.delete.title")}
      >
        {t("projects.delete.prefix")}<strong>{deleteTarget?.name}</strong>{t("projects.delete.suffix")}<br />{t("common.action_irreversible_before")}<b>{t("common.action_irreversible_word")}</b>{t("common.action_irreversible_after")}
      </DeleteModal>
    </>
  );
};
