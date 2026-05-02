import apiClient from '../../../services/client'

export interface KanbanColumnDef {
  id: string
  name: string
  color: string
  order: number
  ticketCount: number
  systemStatus: string | null
}

export const getKanbanColumns = async (): Promise<KanbanColumnDef[]> => {
  const response = await apiClient.get<KanbanColumnDef[]>('/api/kanban/columns')
  return response.data
}

export const createKanbanColumn = async (name: string, color: string): Promise<KanbanColumnDef> => {
  const response = await apiClient.post<KanbanColumnDef>('/api/kanban/columns', { name, color })
  return response.data
}

export const deleteKanbanColumn = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/kanban/columns/${id}`)
}

export const moveTicketToColumn = async (ticketId: string, columnId: string | null): Promise<void> => {
  await apiClient.patch(`/api/tickets/${ticketId}/column`, { columnId })
}
