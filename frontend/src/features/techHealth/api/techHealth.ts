import apiClient from '../../../services/client'
import { TechProject, Dependency, Vulnerability, PaginatedResponse } from '../../../types'

export const getTechProjects = async (params: { clientId?: string; page?: number } = {}): Promise<PaginatedResponse<TechProject>> => {
  const response = await apiClient.get<PaginatedResponse<TechProject>>('/api/tech-health/projects', { params })
  return response.data
}

export const getTechProject = async (id: string): Promise<TechProject> => {
  const response = await apiClient.get<TechProject>(`/api/tech-health/projects/${id}`)
  return response.data
}

export const getDependencies = async (projectId: string): Promise<Dependency[]> => {
  const response = await apiClient.get<Dependency[]>(`/api/tech-health/projects/${projectId}/dependencies`)
  return response.data
}

export const getVulnerabilities = async (params: { projectId?: string; severity?: string } = {}): Promise<Vulnerability[]> => {
  const response = await apiClient.get<Vulnerability[]>('/api/tech-health/vulnerabilities', { params })
  return response.data
}

export const ignoreVulnerability = async (id: string): Promise<Vulnerability> => {
  const response = await apiClient.post<Vulnerability>(`/api/tech-health/vulnerabilities/${id}/ignore`)
  return response.data
}

export const triggerScan = async (projectId: string): Promise<void> => {
  await apiClient.post(`/api/tech-health/projects/${projectId}/scan`)
}
