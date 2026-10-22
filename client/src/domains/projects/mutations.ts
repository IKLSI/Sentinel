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
import { projectKeys } from "@/domains/projects/constants";
import type {
  CreateProject,
  Project,
  ProjectBadge,
  ProjectScanSettings,
  ProjectSummary,
  Remediation,
  StartRemediation,
  SuppressVulnerability,
  UpdateProject,
  VulnerabilitySuppression,
} from "@/domains/projects/types";

const updateCachedProjects = (
  update: (projects: ProjectSummary[]) => ProjectSummary[],
) =>
  queryClient.setQueryData<ProjectSummary[]>(projectKeys.list(), (previous) =>
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

export const useUpdateProjectSettingsMutation = () =>
  usePatchMutation<
    ProjectScanSettings,
    ProjectScanSettings,
    { id: string; data: UpdateProject & { scanFrequency: ScanFrequency } }
  >(ROUTES_API.api.techHealth.projects[":id"].__path, {
    onSuccess: (result, { id }) =>
      updateCachedProjects((projects) =>
        projects.map((project) =>
          project.id === id
            ? {
                ...project,
                scanFrequency: result.scanFrequency,
                branch: result.branch,
                rootPath: result.rootPath,
              }
            : project,
        ),
      ),
  });

export const useSuppressVulnerabilityMutation = () =>
  usePostMutation<
    VulnerabilitySuppression,
    VulnerabilitySuppression,
    { id: string; data: SuppressVulnerability }
  >(ROUTES_API.api.techHealth.projects[":id"].suppressions.__path);

export const useRemoveSuppressionMutation = () =>
  useDeleteMutation<void, void, { id: string; suppressionId: string }>(
    ROUTES_API.api.techHealth.projects[":id"].suppressions[":suppressionId"]
      .__path,
  );

export const useStartRemediationMutation = () =>
  usePostMutation<
    Remediation,
    Remediation,
    { id: string; data: StartRemediation }
  >(ROUTES_API.api.techHealth.projects[":id"].remediations.__path);

export const useEnableProjectBadgeMutation = () =>
  usePostMutation<ProjectBadge, ProjectBadge, { id: string }>(
    "/api/tech-health/projects/:id/badge",
  );
