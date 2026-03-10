import apiClient from '../../../services/client'
import { Notification, PaginatedResponse } from '../../../types'

export const getNotifications = async (params: { page?: number; unreadOnly?: boolean; pageSize?: number } = {}): Promise<PaginatedResponse<Notification>> => {
  const response = await apiClient.get<PaginatedResponse<Notification>>('/api/notifications', { params })
  return response.data
}

export const markAsRead = async (id: string): Promise<void> => {
  await apiClient.patch(`/api/notifications/${id}/read`)
}

export const markAllAsRead = async (): Promise<void> => {
  await apiClient.patch('/api/notifications/read-all')
}

export const deleteNotification = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/notifications/${id}`)
}
