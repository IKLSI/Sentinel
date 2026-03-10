import apiClient from '../../../services/client'

export interface ProjectDto {
  id: string
  name: string
  repositoryUrl?: string
  repositoryType: string
  lastScanAt?: string
  healthScore: number
  healthGrade: string
  totalDependencies: number
  vulnerableDependencies: number
  criticalVulnerabilities: number
}

export interface VulnerabilityDto {
  id: string
  cveId: string
  cvssScore: number
  description: string
  severity: string
  fixedVersion?: string
  advisoryUrl?: string
  detectedAt: string
}

export interface DependencyDto {
  id: string
  name: string
  currentVersion: string
  latestVersion?: string
  type: string
  ecosystem: string
  status: string
  scannedAt: string
  vulnerabilities: VulnerabilityDto[]
}

export interface RuntimeDto {
  id: string
  name: string
  version: string
  eolDate?: string
  isEol: boolean
}

export interface ProjectDetailDto extends ProjectDto {
  scanFrequency: string
  dependencies: DependencyDto[]
  runtimes: RuntimeDto[]
}

export interface CreateProjectDto {
  name: string
  repositoryUrl?: string
}

export const getProjects = async (): Promise<ProjectDto[]> => {
  const response = await apiClient.get<ProjectDto[]>('/api/tech-health/projects')
  return response.data
}

export const getProject = async (id: string): Promise<ProjectDetailDto> => {
  const response = await apiClient.get<ProjectDetailDto>(`/api/tech-health/projects/${id}`)
  return response.data
}

export const deleteProject = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/tech-health/projects/${id}`)
}

export const scanProject = async (id: string): Promise<ProjectDetailDto> => {
  const response = await apiClient.post<ProjectDetailDto>(`/api/tech-health/projects/${id}/scan`)
  return response.data
}

export const updateProject = async (id: string, data: Partial<CreateProjectDto>): Promise<ProjectDto> => {
  const response = await apiClient.put<ProjectDto>(`/api/tech-health/projects/${id}`, data)
  return response.data
}

export const createProject = async (data: CreateProjectDto): Promise<ProjectDto> => {
  const response = await apiClient.post<ProjectDto>('/api/tech-health/projects', {
    name: data.name,
    repositoryUrl: data.repositoryUrl,
    repositoryType: 'GitHub',
    scanFrequency: 'Weekly',
  })
  return response.data
}
