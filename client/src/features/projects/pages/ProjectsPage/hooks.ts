import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useDeleteProjectMutation,
  useScanProjectMutation,
} from "@/domains/projects/mutations";
import { useProjectSearchQuery } from "@/domains/projects/queries";
import type {
  ProjectSearchMatch,
  ProjectSummary,
} from "@/domains/projects/types";
import { useT } from "@/contexts/I18nContext";
import { useApiError } from "@/hooks/useApiError";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useDeleteDialog } from "@/hooks/useDeleteDialog";
import { useToast } from "@/hooks/useToast";
import {
  SECTION_ORDER,
  type SectionKey,
  UNTRACKED_SECTION,
  groupProjectsBySection,
} from "@/features/projects/pages/ProjectsPage/helpers";

export function useScanFeedback(projects: ProjectSummary[]) {
  const { showToast } = useToast();
  const t = useT();
  const onScanError = useApiErrorToast("projects.toast.scan_start_error");
  const { mutate: scanProject } = useScanProjectMutation();
  const [scanningIds, setScanningIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const baselinesRef = useRef(new Map<string, string | null>());

  const stopTracking = useCallback((id: string) => {
    baselinesRef.current.delete(id);
    setScanningIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }, []);

  const startScan = useCallback(
    (id: string) => {
      if (baselinesRef.current.has(id)) return;
      const project = projects.find((p) => p.id === id);
      baselinesRef.current.set(id, project?.lastScanAt ?? null);
      setScanningIds((current) => new Set(current).add(id));

      scanProject(
        { id },
        {
          onSuccess: () =>
            showToast(
              t("projects.toast.scan_started", { name: project?.name ?? "" }),
              "info",
            ),
          onError: (err) => {
            onScanError(err);
            stopTracking(id);
          },
        },
      );
    },
    [projects, showToast, t, scanProject, onScanError, stopTracking],
  );

  useEffect(() => {
    for (const [id, baseline] of baselinesRef.current) {
      const scanned = projects.find((p) => p.id === id);
      if (!scanned || (scanned.lastScanAt ?? null) === baseline) continue;

      stopTracking(id);
      if (scanned.lastScanError)
        showToast(
          t("projects.toast.scan_done_with_errors", { name: scanned.name }),
          "warning",
        );
      else
        showToast(
          t("projects.toast.scan_done", { name: scanned.name }),
          "success",
        );
    }
  }, [projects, stopTracking, showToast, t]);

  return { scanningIds, startScan };
}

const SEARCH_DEBOUNCE_MS = 250;

const INITIAL_COLLAPSED_SECTIONS: Record<SectionKey, boolean> = {
  F: false,
  E: false,
  D: false,
  C: false,
  B: false,
  A: false,
  [UNTRACKED_SECTION]: true,
};

export function useProjectSearch(projects: ProjectSummary[]) {
  const t = useT();
  const apiError = useApiError();
  const [search, setSearch] = useState("");
  const searchQuery = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
  const { data: searchMatches, error: searchFailure } =
    useProjectSearchQuery(searchQuery);
  const searchError = searchFailure
    ? apiError(searchFailure, t("projects.search.error"))
    : null;

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

  return {
    search,
    setSearch,
    searchError,
    filtered,
    matchesById: searchQuery ? matchesById : undefined,
  };
}

export function useProjectSections(
  filtered: ProjectSummary[],
  loading: boolean,
) {
  const [collapsedSections, setCollapsedSections] = useState(
    INITIAL_COLLAPSED_SECTIONS,
  );

  const grouped = useMemo(() => groupProjectsBySection(filtered), [filtered]);

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

  const toggleSection = (grade: SectionKey) =>
    setCollapsedSections((prev) => ({ ...prev, [grade]: !prev[grade] }));

  return { grouped, visibleSections, collapsedSections, toggleSection };
}

export function useDeleteProjectDialog() {
  const t = useT();
  return useDeleteDialog<ProjectSummary>(
    useDeleteProjectMutation(),
    "projects.toast.delete_error",
    ({ name }) => t("projects.toast.delete_success", { name }),
  );
}
