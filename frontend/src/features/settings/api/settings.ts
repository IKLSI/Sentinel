import apiClient from '../../../services/client'

export interface SlaSettings {
  criticalHours: number
  highHours: number
  mediumHours: number
  lowHours: number
}

export interface OrganizationSettings {
  name: string
  slug: string
  timezone: string
  createdAt: string
}

export const getSlaSettings = async (): Promise<SlaSettings> => {
  const response = await apiClient.get<SlaSettings>('/api/settings/sla')
  return response.data
}

export const updateSlaSettings = async (data: SlaSettings): Promise<SlaSettings> => {
  const response = await apiClient.put<SlaSettings>('/api/settings/sla', data)
  return response.data
}

export const getOrganizationSettings = async (): Promise<OrganizationSettings> => {
  const response = await apiClient.get<OrganizationSettings>('/api/settings/organization')
  return response.data
}

export const updateOrganizationSettings = async (data: { name: string; timezone: string }): Promise<OrganizationSettings> => {
  const response = await apiClient.put<OrganizationSettings>('/api/settings/organization', data)
  return response.data
}

export interface IntegrationSettings {
  hasGithubToken: boolean
  hasGitlabToken: boolean
}

export interface ImportResult {
  importedCount: number
  skippedCount: number
}

export const getIntegrationSettings = async (): Promise<IntegrationSettings> => {
  const response = await apiClient.get<IntegrationSettings>('/api/settings/integrations')
  return response.data
}

export const connectGithub = async (token: string): Promise<ImportResult> => {
  const response = await apiClient.post<ImportResult>('/api/settings/integrations/github', { token })
  return response.data
}

export const connectGitlab = async (token: string): Promise<ImportResult> => {
  const response = await apiClient.post<ImportResult>('/api/settings/integrations/gitlab', { token })
  return response.data
}
