import apiClient from '../../../services/client'
import { LoginResponse, User } from '../../../types'

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/api/auth/login', { email, password })
  return response.data
}

export const logout = async (): Promise<void> => {
  const refreshToken = localStorage.getItem('refreshToken')
  if (refreshToken) await apiClient.post('/api/auth/logout', { refreshToken })
}

export const me = async (): Promise<User> => {
  const response = await apiClient.get<User>('/api/auth/me')
  return response.data
}

export const forgotPassword = async (email: string): Promise<void> => {
  await apiClient.post('/api/auth/forgot-password', { email })
}

export const resetPassword = async (token: string, password: string): Promise<void> => {
  await apiClient.post('/api/auth/reset-password', { token, password })
}
