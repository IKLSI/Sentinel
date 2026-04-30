import apiClient from '../../../services/client'
import { downloadExcel } from '../../../utils/download'

export interface TimeEntryDto {
  id: string
  ticketId?: string
  ticketTitle?: string
  techProjectId?: string
  techProjectName?: string
  userId: string
  userName: string
  date: string
  durationMinutes: number
  comment?: string
}

export interface CreateTimeEntryDto {
  ticketId?: string
  techProjectId?: string
  date: string
  durationMinutes: number
  comment?: string
}

export interface UpdateTimeEntryDto {
  date?: string
  durationMinutes?: number
  comment?: string
  techProjectId?: string | null
  ticketId?: string | null
}

export const getTimeEntries = async (from?: string, to?: string): Promise<TimeEntryDto[]> => {
  const response = await apiClient.get<TimeEntryDto[]>('/api/time-entries', { params: { from, to } })
  return response.data
}

export const createTimeEntry = async (data: CreateTimeEntryDto): Promise<TimeEntryDto> => {
  const response = await apiClient.post<TimeEntryDto>('/api/time-entries', data)
  return response.data
}

export const updateTimeEntry = async (id: string, data: UpdateTimeEntryDto): Promise<TimeEntryDto> => {
  const response = await apiClient.patch<TimeEntryDto>(`/api/time-entries/${id}`, data)
  return response.data
}

export const deleteTimeEntry = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/time-entries/${id}`)
}

export const exportTimeEntriesExcel = async (params?: { from?: string; to?: string }): Promise<void> => {
  const from = params?.from ?? 'debut'
  const to = params?.to ?? 'fin'
  await downloadExcel('/api/time-entries/export/excel', `temps-${from}-${to}.xlsx`, params as Record<string, unknown>)
}
