import apiClient from '../../../services/client'

export interface TicketStatusDef {
  id: string
  name: string
  color: string
  order: number
  isDefault: boolean
  isClosed: boolean
  ticketCount: number
}

export const getTicketStatuses = async (): Promise<TicketStatusDef[]> => {
  const response = await apiClient.get<TicketStatusDef[]>('/api/statuses')
  return response.data
}

export const createTicketStatus = async (name: string, color: string): Promise<TicketStatusDef> => {
  const response = await apiClient.post<TicketStatusDef>('/api/statuses', { name, color })
  return response.data
}

export const deleteTicketStatus = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/statuses/${id}`)
}

export const changeTicketStatus = async (ticketId: string, statusId: string): Promise<void> => {
  await apiClient.patch(`/api/tickets/${ticketId}/status`, { statusId })
}
