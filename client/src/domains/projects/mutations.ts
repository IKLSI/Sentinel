import { ROUTES_API } from "@/configs/api-routes.gen";
import { queryClient } from "@/configs/queryClient";
import {
  invalidateKeys,
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
  UpdateProject,
} from "@/domains/projects/types";

const updateCachedProjects = (update: (projects: Project[]) => Project[]) =>
  queryClient.setQueryData<Project[]>(PROJECTS_QUERY_KEY, (previous) =>
    update(previous ?? []),
  );

export const useCreateProjectMutation = () =>
  usePostMutation<Project, Project, { data: CreateProject }>(
    ROUTES_API.api.techHealth.projects.__path,
    { onSuccess: () => invalidateKeys([PROJECTS_QUERY_KEY]) },
  );

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
