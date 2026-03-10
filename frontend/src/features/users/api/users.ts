import apiClient from '../../../services/client'
import { User, UserRole, PaginatedResponse, AuditLog } from '../../../types'

export const getUsers = async (params: { page?: number; role?: UserRole; search?: string } = {}): Promise<PaginatedResponse<User>> => {
  const response = await apiClient.get<PaginatedResponse<User>>('/api/users', { params })
  return response.data
}

export const getUser = async (id: string): Promise<User> => {
  const response = await apiClient.get<User>(`/api/users/${id}`)
  return response.data
}

export const createUser = async (data: Partial<User> & { password: string }): Promise<User> => {
  const response = await apiClient.post<User>('/api/users', data)
  return response.data
}

export const updateUser = async (id: string, data: Partial<User>): Promise<User> => {
  const response = await apiClient.put<User>(`/api/users/${id}`, data)
  return response.data
}

export const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/users/${id}`)
}

export const getAuditLogs = async (params: { page?: number; userId?: string; entityType?: string } = {}): Promise<PaginatedResponse<AuditLog>> => {
  const response = await apiClient.get<PaginatedResponse<AuditLog>>('/api/audit-logs', { params })
  return response.data
}

export const updateUserTheme = async (theme: 'dark' | 'light'): Promise<void> => {
  await apiClient.patch('/api/users/me/preferences', { theme })
}
