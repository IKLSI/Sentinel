import apiClient from '../../../services/client'
import { Sprint } from '../../../types'

interface SprintDto {
  id: string
  projectId: string
  name: string
  goal?: string
  status: string
  startDate: string
  endDate: string
  ticketCount: number
  completedCount: number
}

function mapSprintDto(dto: SprintDto): Sprint {
  return {
    id: dto.id,
    projectId: dto.projectId,
    name: dto.name,
    goal: dto.goal,
    status: dto.status as Sprint['status'],
    startDate: dto.startDate,
    endDate: dto.endDate,
    ticketCount: dto.ticketCount,
    completedCount: dto.completedCount,
  }
}

export const getSprints = async (params?: { projectId?: string }): Promise<Sprint[]> => {
  const response = await apiClient.get('/api/sprints', { params })
  return (response.data as SprintDto[]).map(mapSprintDto)
}

export const getSprint = async (id: string): Promise<Sprint> => {
  const response = await apiClient.get(`/api/sprints/${id}`)
  return mapSprintDto(response.data as SprintDto)
}

export const createSprint = async (data: {
  projectId: string
  name: string
  goal?: string
  startDate: string
  endDate: string
}): Promise<Sprint> => {
  const response = await apiClient.post('/api/sprints', data)
  return mapSprintDto(response.data as SprintDto)
}

export const updateSprint = async (id: string, data: {
  name?: string
  goal?: string
  status?: string
  startDate?: string
  endDate?: string
}): Promise<Sprint> => {
  const response = await apiClient.put(`/api/sprints/${id}`, data)
  return mapSprintDto(response.data as SprintDto)
}

export const deleteSprint = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/sprints/${id}`)
}

export const assignTicket = async (sprintId: string, ticketId: string): Promise<void> => {
  await apiClient.post(`/api/sprints/${sprintId}/tickets/${ticketId}`)
}

export const removeTicket = async (sprintId: string, ticketId: string): Promise<void> => {
  await apiClient.delete(`/api/sprints/${sprintId}/tickets/${ticketId}`)
}
