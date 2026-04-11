import apiClient from '../../../services/client'

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
  isManual: boolean
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

export const exportTimeEntriesCsv = async (params?: { from?: string; to?: string }): Promise<void> => {
  const response = await apiClient.get('/api/time-entries/export/csv', { params, responseType: 'blob' })
  const from = params?.from ?? 'debut'
  const to = params?.to ?? 'fin'
  const filename = `temps-${from}-${to}.csv`
  const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
