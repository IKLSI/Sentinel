import apiClient from '../../../services/client'

export interface ApiKey {
  id: string
  name: string
  prefix: string
  expiresAt: string | null
  lastUsedAt: string | null
  createdAt: string
  createdByName: string
}

export interface CreatedApiKey {
  id: string
  name: string
  prefix: string
  key: string
  expiresAt: string | null
  createdAt: string
}

export const listApiKeys = async (signal?: AbortSignal): Promise<ApiKey[]> => {
  const response = await apiClient.get<ApiKey[]>('/api/settings/api-keys', { signal })
  return response.data
}

export const createApiKey = async (data: { name: string; expiresAt?: string | null }): Promise<CreatedApiKey> => {
  const response = await apiClient.post<CreatedApiKey>('/api/settings/api-keys', data)
  return response.data
}

export const revokeApiKey = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/settings/api-keys/${id}`)
}
