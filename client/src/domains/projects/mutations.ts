import { useMutation } from "@tanstack/react-query";
import { ROUTES_API } from "@/configs/api-routes.gen";
import apiClient from "@/configs/apiClient";
import { queryClient } from "@/configs/queryClient";
import {
  useDeleteMutation,
  usePatchMutation,
  usePostMutation,
} from "@/domains/helpers";
import type { ScanFrequency } from "@/enums";
import { PROJECTS_QUERY_KEY } from "@/domains/projects/constants";
import type {
  CreateProject,
  Project,
  ProjectScanFrequency,
  ProjectSummary,
  UpdateProject,
} from "@/domains/projects/types";

const updateCachedProjects = (
  update: (projects: ProjectSummary[]) => ProjectSummary[],
) =>
  queryClient.setQueryData<ProjectSummary[]>(PROJECTS_QUERY_KEY, (previous) =>
    update(previous ?? []),
  );

const createProject = (project: CreateProject) =>
  apiClient
    .post<Project>(ROUTES_API.api.techHealth.projects.__path, project)
    .then((response) => response.data);

export const useImportProjectsMutation = () =>
  useMutation<Project[], Error, CreateProject[]>({
    mutationFn: (projects) => Promise.all(projects.map(createProject)),
  });

export const useDeleteProjectMutation = () =>
  useDeleteMutation<void, void, { id: string }>(
    ROUTES_API.api.techHealth.projects[":id"].__path,
    {
      onSuccess: (_result, { id }) =>
        updateCachedProjects((projects) =>
          projects.filter((project) => project.id !== id),
        ),
    },
  );

export const useScanProjectMutation = () =>
  usePostMutation<void, void, { id: string }>(
    ROUTES_API.api.techHealth.projects[":id"].scan.__path,
  );

export const useUpdateProjectFrequencyMutation = () =>
  usePatchMutation<
    ProjectScanFrequency,
    ProjectScanFrequency,
    { id: string; data: UpdateProject & { scanFrequency: ScanFrequency } }
  >(ROUTES_API.api.techHealth.projects[":id"].__path, {
    onSuccess: (_result, { id, data }) =>
      updateCachedProjects((projects) =>
        projects.map((project) =>
          project.id === id
            ? { ...project, scanFrequency: data.scanFrequency }
            : project,
        ),
      ),
  });
