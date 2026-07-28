import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ScanFrequency } from "@/types/enums";
import {
  createProject,
  deleteProject,
  exportProjectsExcel,
  getAvailableRepos,
  getProjects,
  scanProject,
  updateProjectFrequency,
  type ProjectDto,
} from "../api/projects";

export const projectsQueryKey = ["projects"] as const;

export const useProjects = (enabled = true) => {
  return useQuery<ProjectDto[]>({
    queryKey: projectsQueryKey,
    queryFn: () => getProjects(),
    enabled,
    staleTime: 60_000,
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: (_data, id) => {
      queryClient.setQueryData<ProjectDto[]>(projectsQueryKey, (prev) =>
        (prev ?? []).filter((p) => p.id !== id),
      );
    },
  });
};

export const useScanProject = () => {
  return useMutation({
    mutationFn: scanProject,
  });
};

export const useUpdateProjectFrequency = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      scanFrequency,
    }: {
      id: string;
      scanFrequency: ScanFrequency;
    }) => updateProjectFrequency(id, scanFrequency),
    onSuccess: (_data, { id, scanFrequency }) => {
      queryClient.setQueryData<ProjectDto[]>(projectsQueryKey, (prev) =>
        (prev ?? []).map((p) => (p.id === id ? { ...p, scanFrequency } : p)),
      );
    },
  });
};

export const useExportProjectsExcel = () => {
  return useMutation({
    mutationFn: exportProjectsExcel,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: projectsQueryKey }),
  });
};

export const useAvailableRepos = (enabled: boolean) => {
  const query = useQuery({
    queryKey: ["available-repos"],
    queryFn: ({ signal }) => getAvailableRepos(signal),
    enabled,
  });

  return {
    repos: query.data?.repos ?? [],
    hasToken: query.data?.hasToken ?? true,
    fetchFailed: query.data?.fetchFailed ?? false,
    fetchFailedStatusCode: query.data?.fetchFailedStatusCode,
    loading: query.isLoading,
    error: query.isError,
  };
};
