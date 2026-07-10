import apiClient from "../../../services/client";

export interface RemediationTargetDto {
  name: string;
  ecosystem: string;
  currentVersion: string;
  targetVersion: string;
  isBreaking: boolean;
  cveIds: string[];
}

export interface StaleLockfileDto {
  path: string;
  command: string;
}

export interface RemediationPreviewDto {
  canRemediate: boolean;
  reason?: string;
  hasBreakingChanges: boolean;
  targets: RemediationTargetDto[];
  files: string[];
  staleLockfiles: StaleLockfileDto[];
}

export interface RemediationResultDto {
  id: string;
  status: string;
  pullRequestUrl?: string;
  error?: string;
  dependenciesPatched: number;
  hasBreakingChanges: boolean;
  staleLockfiles: StaleLockfileDto[];
}

export const getRemediationPreview = async (
  id: string,
  signal?: AbortSignal,
): Promise<RemediationPreviewDto> => {
  const response = await apiClient.get<RemediationPreviewDto>(
    `/api/remediation/projects/${id}/preview`,
    { signal },
  );
  return response.data;
};

export const executeRemediation = async (
  id: string,
): Promise<RemediationResultDto> => {
  const response = await apiClient.post<RemediationResultDto>(
    `/api/remediation/projects/${id}`,
  );
  return response.data;
};
