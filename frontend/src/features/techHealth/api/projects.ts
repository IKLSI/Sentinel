import apiClient from "../../../services/client";
import { downloadExcel } from "../../../utils/download";
import {
  ScanFrequency,
  type DependencyStatus,
  type DependencyType,
  type VulnerabilitySeverity,
  Provider,
} from "../../../types/enums";

export interface ProjectDto {
  id: string;
  name: string;
  repositoryUrl?: string;
  repositoryType: string;
  lastScanAt?: string;
  healthScore: number;
  healthGrade: string;
  scanFrequency: ScanFrequency;
  totalDependencies: number;
  vulnerableDependencies: number;
  criticalVulnerabilities: number;
  totalVulnerabilities: number;
  totalTickets: number;
}

export interface VulnerabilityDto {
  id: string;
  cveId: string;
  cvssScore: number;
  description: string;
  severity: VulnerabilitySeverity;
  fixedVersion?: string;
  advisoryUrl?: string;
  detectedAt: string;
}

export interface DependencyDto {
  id: string;
  name: string;
  currentVersion: string;
  latestVersion?: string;
  type: DependencyType;
  ecosystem: string;
  status: DependencyStatus;
  scannedAt: string;
  vulnerabilities: VulnerabilityDto[];
}

export interface RuntimeDto {
  id: string;
  name: string;
  version: string;
  eolDate?: string;
  isEol: boolean;
}

export interface ProjectDetailDto extends ProjectDto {
  scanFrequency: ScanFrequency;
  dependencies: DependencyDto[];
  runtimes: RuntimeDto[];
}

interface CreateProjectDto {
  name: string;
  repositoryUrl?: string;
  repositoryType?: string;
}

export const getProjects = async (
  signal?: AbortSignal,
): Promise<ProjectDto[]> => {
  const response = await apiClient.get<ProjectDto[]>(
    "/api/tech-health/projects",
    { signal },
  );
  return response.data;
};

export const getProject = async (
  id: string,
  signal?: AbortSignal,
): Promise<ProjectDetailDto> => {
  const response = await apiClient.get<ProjectDetailDto>(
    `/api/tech-health/projects/${id}`,
    { signal },
  );
  return response.data;
};

export const deleteProject = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/tech-health/projects/${id}`);
};

export const scanProject = async (id: string): Promise<void> => {
  await apiClient.post(`/api/tech-health/projects/${id}/scan`);
};

export const createProject = async (
  data: CreateProjectDto,
): Promise<ProjectDto> => {
  const response = await apiClient.post<ProjectDto>(
    "/api/tech-health/projects",
    {
      name: data.name,
      repositoryUrl: data.repositoryUrl,
      repositoryType: data.repositoryType ?? Provider.GitHub,
      scanFrequency: ScanFrequency.Weekly,
    },
  );
  return response.data;
};

export interface AvailableRepoDto {
  name: string;
  url: string;
  platform: Provider;
}

export interface AvailableReposResult {
  repos: AvailableRepoDto[];
  hasToken: boolean;
  fetchFailed: boolean;
  fetchFailedStatusCode?: number;
}

export const getAvailableRepos = async (
  signal?: AbortSignal,
): Promise<AvailableReposResult> => {
  const response = await apiClient.get<AvailableReposResult>(
    "/api/tech-health/projects/available-repos",
    { signal },
  );
  return response.data;
};

export const updateProjectFrequency = async (
  id: string,
  scanFrequency: ScanFrequency,
): Promise<void> => {
  await apiClient.patch(`/api/tech-health/projects/${id}`, { scanFrequency });
};

export const exportProjectsExcel = async (): Promise<void> => {
  await downloadExcel(
    "/api/tech-health/projects/export/excel",
    `techhealth-${new Date().toISOString().split("T")[0]}.xlsx`,
  );
};
