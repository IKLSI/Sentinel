import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { useExportProjectsExcelMutation } from "@/domains/projects/downloads";
import {
  useProjectsQuery,
  useScanProgressQuery,
} from "@/domains/projects/queries";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import AccountTreeOutlined from "@mui/icons-material/AccountTreeOutlined";
import CloudDownloadOutlined from "@mui/icons-material/CloudDownloadOutlined";
import { DeleteModal } from "@/components/ui/common/modal/DeleteModal";
import { EmptyState } from "@/components/ui/common/feedback/EmptyState";
import { ExportButton } from "@/components/ui/common/ExportButton";
import { SearchInput } from "@/components/ui/forms/SearchInput";
import { PANEL_SX } from "@/helpers/cardSx";
import { PageContainer } from "@/components/layout/PageContainer";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/contexts/I18nContext";
import type { ProjectSummary, ScanProgress } from "@/domains/projects/types";
import { ProjectsSection } from "@/features/projects/pages/ProjectsPage/components/ProjectsSection";
import { ProjectsSkeleton } from "@/features/projects/pages/ProjectsPage/components/ProjectsSkeleton";
import { ProjectSettingsModal } from "@/features/projects/pages/ProjectsPage/components/ProjectSettingsModal";
import { SyncProjectModal } from "@/features/projects/pages/ProjectsPage/components/SyncProjectModal";
import { LoadErrorState } from "@/components/ui/common/feedback/LoadErrorState";
import {
  useDeleteProjectDialog,
  useProjectSearch,
  useProjectSections,
  useScanFeedback,
} from "@/features/projects/pages/ProjectsPage/hooks";

const routeApi = getRouteApi("/_authenticated/projects/");

export const ProjectsPage: React.FC = () => {
  const { showToast } = useToast();
  const t = useT();
  const { openImport } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const {
    data: projects = [],
    isLoading: loading,
    isError: loadFailed,
    isFetching: refetching,
    refetch,
  } = useProjectsQuery();
  const exportProjectsMutation = useExportProjectsExcelMutation();
  const {
    scanningIds,
    startScan: handleScan,
    cancelScan: handleCancelScan,
  } = useScanFeedback(projects);
  const deleteDialog = useDeleteProjectDialog();
  const [editTarget, setEditTarget] = useState<ProjectSummary | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(() => !!openImport);

  useEffect(() => {
    if (openImport)
      navigate({
        search: (previous) => ({ ...previous, openImport: undefined }),
        replace: true,
      });
  }, [openImport, navigate]);

  const handleExport = () => {
    exportProjectsMutation.mutate(undefined, {
      onError: () => showToast(t("projects.toast.export_error"), "error"),
    });
  };

  const { search, setSearch, searchError, filtered, matchesById } =
    useProjectSearch(projects);
  const { grouped, visibleSections, collapsedSections, toggleSection } =
    useProjectSections(filtered, loading);

  const { data: scanProgress } = useScanProgressQuery();
  const progressById = useMemo(
    () =>
      new Map<string, ScanProgress>(
        (scanProgress ?? []).map((progress) => [progress.projectId, progress]),
      ),
    [scanProgress],
  );

  const emptySubtitle =
    projects.length > 0
      ? t("projects.empty.adjust_search")
      : t("projects.empty.create_first");

  const renderContent = () => {
    if (loading) return <ProjectsSkeleton />;
    if (loadFailed && projects.length === 0)
      return (
        <LoadErrorState onRetry={() => void refetch()} retrying={refetching} />
      );
    return (
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
              ...PANEL_SX,
            }}
          >
            <EmptyState
              icon={AccountTreeOutlined}
              title={t("projects.empty.title")}
              subtitle={searchError ?? emptySubtitle}
              iconSize={40}
            />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {visibleSections.map((grade) => (
              <ProjectsSection
                key={grade}
                grade={grade}
                items={grouped[grade]}
                collapsed={collapsedSections[grade]}
                onToggleCollapsed={() => toggleSection(grade)}
                scanningIds={scanningIds}
                matchesById={matchesById}
                progressById={progressById}
                onEdit={setEditTarget}
                onDelete={deleteDialog.setTarget}
                onScan={handleScan}
                onCancelScan={handleCancelScan}
              />
            ))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <>
      <PageContainer
        sx={{ maxHeight: "100vh", boxSizing: "border-box", minHeight: 0 }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: "16px",
            flexShrink: 0,
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t("projects.search_placeholder")}
              sx={{ maxWidth: "52vw" }}
            />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Button
              variant="contained"
              size="small"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                flexShrink: 0,
                height: "32px",
                px: "14px",
              }}
              onClick={() => setShowSyncModal(true)}
            >
              <CloudDownloadOutlined sx={{ fontSize: 14 }} />
              {t("projects.import_repos")}
            </Button>
            <ExportButton
              onClick={handleExport}
              exporting={exportProjectsMutation.isPending}
              label={t("projects.export")}
            />
          </Box>
        </Box>
        {renderContent()}
      </PageContainer>

      <SyncProjectModal
        open={showSyncModal}
        onClose={() => setShowSyncModal(false)}
      />

      {editTarget && (
        <ProjectSettingsModal
          key={editTarget.id}
          project={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}

      <DeleteModal
        open={!!deleteDialog.target}
        onClose={deleteDialog.closeDialog}
        onConfirm={deleteDialog.confirm}
        loading={deleteDialog.deleting}
        title={t("projects.delete.title")}
        irreversible
      >
        {t("projects.delete.prefix")}
        <strong>{deleteDialog.target?.name}</strong>
        {t("projects.delete.suffix")}
      </DeleteModal>
    </>
  );
};
