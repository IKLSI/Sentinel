import apiClient from '../../../services/client'
import { User, UserRole, PaginatedResponse } from '../../../types'

export const getUsers = async (params: { page?: number; role?: UserRole; search?: string } = {}): Promise<PaginatedResponse<User>> => {
  const response = await apiClient.get<PaginatedResponse<User>>('/api/users', { params })
  return response.data
}

export const getUser = async (id: string): Promise<User> => {
  const response = await apiClient.get<User>(`/api/users/${id}`)
  return response.data
}

export const updateUser = async (id: string, data: Partial<User>): Promise<User> => {
  const response = await apiClient.put<User>(`/api/users/${id}`, data)
  return response.data
}

export const updateUserTheme = async (theme: 'dark' | 'light'): Promise<void> => {
  await apiClient.patch('/api/users/me/preferences', { theme })
}

export const updatePreferences = async (data: { theme?: 'dark' | 'light' }): Promise<void> => {
  await apiClient.patch('/api/users/me/preferences', data)
}

export const updateMyProfile = async (data: { firstName?: string; lastName?: string }): Promise<User> => {
  const response = await apiClient.patch<User>('/api/users/me', data)
  return response.data
}

export const inviteUser = async (data: { email: string; firstName: string; lastName: string; role: UserRole; password: string }): Promise<User> => {
  const response = await apiClient.post<User>('/api/users', data)
  return response.data
}

export const toggleUserActive = async (userId: string, isActive: boolean): Promise<User> => {
  const response = await apiClient.put<User>(`/api/users/${userId}`, { isActive })
  return response.data
}
