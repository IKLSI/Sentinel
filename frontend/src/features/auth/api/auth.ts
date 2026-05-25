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

export interface RegisterPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  organizationName: string
}

export const register = async (payload: RegisterPayload): Promise<void> => {
  await apiClient.post('/api/auth/register', payload)
}

export const verifyEmail = async (token: string): Promise<void> => {
  await apiClient.post('/api/auth/verify-email', { token })
}

export const resendVerification = async (email: string): Promise<void> => {
  await apiClient.post('/api/auth/resend-verification', { email })
}
