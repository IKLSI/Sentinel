import { ROUTES_API } from "@/configs/api-routes.gen";
import { queryClient } from "@/configs/queryClient";
import {
  useDeleteMutation,
  usePatchMutation,
  usePostMutation,
} from "@/domains/helpers";
import type { ScanFrequency } from "@/enums";
import { projectKeys } from "@/domains/projects/constants";
import type {
  ImportProjects,
  Project,
  ProjectBadge,
  ProjectScanSettings,
  ProjectSummary,
  Remediation,
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

export const useImportProjectsMutation = () =>
  usePostMutation<Project[], Project[], { data: ImportProjects }>(
    ROUTES_API.api.techHealth.projects.import.__path,
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

export const useCancelProjectScanMutation = () =>
  useDeleteMutation<void, void, { id: string }>(
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
  usePostMutation<Remediation, Remediation, { id: string }>(
    ROUTES_API.api.techHealth.projects[":id"].remediations.__path,
  );

export const useEnableProjectBadgeMutation = () =>
  usePostMutation<ProjectBadge, ProjectBadge, { id: string }>(
    ROUTES_API.api.techHealth.projects[":id"].badge.__path,
  );
