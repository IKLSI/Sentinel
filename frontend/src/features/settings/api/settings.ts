import apiClient from '../../../services/client'

export interface OrganizationSettings {
  name: string
  slug: string
  securityAlertsEnabled: boolean
  alertMinSeverity: string
  createdAt: string
}

export const getOrganizationSettings = async (signal?: AbortSignal): Promise<OrganizationSettings> => {
  const response = await apiClient.get<OrganizationSettings>('/api/settings/organization', { signal })
  return response.data
}

export const updateOrganizationSettings = async (data: { name: string; securityAlertsEnabled: boolean; alertMinSeverity: string }): Promise<OrganizationSettings> => {
  const response = await apiClient.put<OrganizationSettings>('/api/settings/organization', data)
  return response.data
}

export interface IntegrationSettings {
  hasGithubToken: boolean
  hasGitlabToken: boolean
}

export const getIntegrationSettings = async (signal?: AbortSignal): Promise<IntegrationSettings> => {
  const response = await apiClient.get<IntegrationSettings>('/api/settings/integrations', { signal })
  return response.data
}

export const connectGithub = async (token: string): Promise<void> => {
  await apiClient.post('/api/settings/integrations/github', { token })
}

export const connectGitlab = async (token: string): Promise<void> => {
  await apiClient.post('/api/settings/integrations/gitlab', { token })
}
