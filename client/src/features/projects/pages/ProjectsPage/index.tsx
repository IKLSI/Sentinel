import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { useExportProjectsExcelMutation } from "@/domains/projects/downloads";
import { useDeleteProjectMutation } from "@/domains/projects/mutations";
import {
  useProjectSearchQuery,
  useProjectsQuery,
  useScanProgressQuery,
} from "@/domains/projects/queries";
import Box from "@mui/material/Box";
import AccountTreeOutlined from "@mui/icons-material/AccountTreeOutlined";
import { DeleteModal } from "@/components/ui/common/DeleteModal";
import { EmptyState } from "@/components/ui/common/EmptyState";
import { PageContainer } from "@/components/layout/PageContainer";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/contexts/I18nContext";
import type {
  ProjectSearchMatch,
  ProjectSummary,
  ScanProgress,
} from "@/domains/projects/types";
import { useApiError } from "@/hooks/useApiError";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  SECTION_ORDER,
  type SectionKey,
  UNTRACKED_SECTION,
  getGrade,
  isUntracked,
} from "@/features/projects/pages/ProjectsPage/helpers";
import { ProjectsToolbar } from "@/features/projects/pages/ProjectsPage/components/ProjectsToolbar";
import { ProjectsSection } from "@/features/projects/pages/ProjectsPage/components/ProjectsSection";
import { ProjectsSkeleton } from "@/features/projects/pages/ProjectsPage/components/ProjectsSkeleton";
import { ProjectSettingsModal } from "@/features/projects/pages/ProjectsPage/components/ProjectSettingsModal";
import { SyncProjectModal } from "@/features/projects/pages/ProjectsPage/components/SyncProjectModal";
import { LoadErrorState } from "@/components/ui/common/LoadErrorState";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useScanFeedback } from "@/features/projects/pages/ProjectsPage/hooks";

const routeApi = getRouteApi("/_authenticated/projects/");

const SEARCH_DEBOUNCE_MS = 250;

export const ProjectsPage: React.FC = () => {
  const { showToast } = useToast();
  const t = useT();
  const apiError = useApiError();
  const onDeleteError = useApiErrorToast("projects.toast.delete_error");
  const { openImport } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const {
    data: projects = [],
    isLoading: loading,
    isError: loadFailed,
    isFetching: refetching,
    refetch,
  } = useProjectsQuery();
  const deleteProjectMutation = useDeleteProjectMutation();
  const exportProjectsMutation = useExportProjectsExcelMutation();
  const { scanningIds, startScan: handleScan } = useScanFeedback(projects);
  const deleting = deleteProjectMutation.isPending;
  const exporting = exportProjectsMutation.isPending;
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ProjectSummary | null>(null);
  const [editTarget, setEditTarget] = useState<ProjectSummary | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(() => !!openImport);

  useEffect(() => {
    if (openImport)
      navigate({
        search: (previous) => ({ ...previous, openImport: undefined }),
        replace: true,
      });
  }, [openImport, navigate]);
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

  const handleExport = () => {
    exportProjectsMutation.mutate(undefined, {
      onError: () => showToast(t("projects.toast.export_error"), "error"),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const projectName = deleteTarget.name;
    deleteProjectMutation.mutate(
      { id: deleteTarget.id },
      {
        onSuccess: () => {
          setDeleteTarget(null);
          showToast(
            t("projects.toast.delete_success", { name: projectName }),
            "success",
          );
        },
        onError: onDeleteError,
      },
    );
  };

  const searchQuery = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
  const { data: searchMatches, error: searchFailure } =
    useProjectSearchQuery(searchQuery);
  const searchError = searchFailure
    ? apiError(searchFailure, t("projects.search.error"))
    : null;

  const { data: scanProgress } = useScanProgressQuery();
  const progressById = useMemo(
    () =>
      new Map<string, ScanProgress>(
        (scanProgress ?? []).map((progress) => [progress.projectId, progress]),
      ),
    [scanProgress],
  );

  const matchesById = useMemo(
    () =>
      new Map<string, ProjectSearchMatch>(
        (searchMatches ?? []).map((match) => [match.projectId, match]),
      ),
    [searchMatches],
  );

  const filtered = useMemo(() => {
    if (!searchQuery) return projects;
    if (searchFailure) return [];
    return searchMatches
      ? projects.filter((project) => matchesById.has(project.id))
      : projects;
  }, [projects, searchQuery, searchMatches, searchFailure, matchesById]);

  const grouped = useMemo(() => {
    const map: Record<SectionKey, ProjectSummary[]> = {
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
    return map;
  }, [filtered]);

  const visibleSections = useMemo(
    () => SECTION_ORDER.filter((grade) => grouped[grade].length > 0),
    [grouped],
  );

  const onlyUntracked =
    filtered.length > 0 &&
    grouped[UNTRACKED_SECTION].length === filtered.length;

  useEffect(() => {
    if (loading || !onlyUntracked) return;
    setCollapsedSections((prev) => ({
      ...prev,
      [UNTRACKED_SECTION]: false,
    }));
  }, [loading, onlyUntracked]);

  return (
    <>
      <PageContainer
        sx={{ maxHeight: "100vh", boxSizing: "border-box", minHeight: 0 }}
      >
        <ProjectsToolbar
          search={search}
          onSearchChange={setSearch}
          onImport={() => setShowSyncModal(true)}
          onExport={handleExport}
          exporting={exporting}
        />

        {loading ? (
          <ProjectsSkeleton />
        ) : loadFailed && projects.length === 0 ? (
          <LoadErrorState
            onRetry={() => void refetch()}
            retrying={refetching}
          />
        ) : (
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
              pr: "4px",
              pb: "2px",
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
                <EmptyState
                  icon={AccountTreeOutlined}
                  title={t("projects.empty.title")}
                  subtitle={
                    searchError ??
                    (projects.length === 0
                      ? t("projects.empty.create_first")
                      : t("projects.empty.adjust_search"))
                  }
                  iconSize={40}
                />
              </Box>
            ) : (
              <Box
                sx={{
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
                    scanningIds={scanningIds}
                    matchesById={searchQuery ? matchesById : undefined}
                    progressById={progressById}
                    onEdit={setEditTarget}
                    onDelete={setDeleteTarget}
                    onScan={handleScan}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}
      </PageContainer>

      <SyncProjectModal
        open={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        showToast={showToast}
      />

      {editTarget && (
        <ProjectSettingsModal
          key={editTarget.id}
          project={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}

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
