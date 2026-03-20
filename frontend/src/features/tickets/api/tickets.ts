import apiClient from '../../../services/client'
import { Ticket, TicketComment, TicketFilters, PaginatedResponse, TicketStatus } from '../../../types'

interface TicketDto {
  id: string
  projectId?: string
  projectName?: string
  title: string
  description: string
  priority: string
  type: string
  status: string
  assignedToId?: string
  assignedToName?: string
  estimatedHours?: number
  totalTimeMinutes?: number
  createdById: string
  createdByName: string
  createdAt: string
  updatedAt: string
  slaDeadline?: string
  slaBreached: boolean
  tags: string[]
  comments: { id: string; authorId: string; authorName: string; content: string; createdAt: string; updatedAt: string }[]
  history: { id: string; userId: string; userName: string; field: string; oldValue?: string; newValue?: string; createdAt: string }[]
}

interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
}

function mapTicketDto(dto: TicketDto): Ticket {
  const idShort = dto.id.replace(/-/g, '').substring(0, 6).toUpperCase()
  return {
    id: dto.id,
    reference: `TKT-${idShort}`,
    title: dto.title,
    description: dto.description,
    projectId: dto.projectId,
    projectName: dto.projectName,
    assigneeId: dto.assignedToId,
    assignee: dto.assignedToName
      ? { id: dto.assignedToId ?? '', email: '', firstName: dto.assignedToName.split(' ')[0] ?? dto.assignedToName, lastName: dto.assignedToName.split(' ').slice(1).join(' '), role: 'technician' as const, organizationId: '', isActive: true, createdAt: dto.createdAt }
      : undefined,
    priority: dto.priority as Ticket['priority'],
    type: dto.type as Ticket['type'],
    status: dto.status as TicketStatus,
    slaDeadline: dto.slaDeadline,
    slaBreached: dto.slaBreached,
    estimatedHours: dto.estimatedHours,
    timeSpentMinutes: dto.totalTimeMinutes,
    comments: dto.comments.map((c) => ({
      id: c.id, ticketId: dto.id, authorId: c.authorId,
      author: { id: c.authorId, email: '', firstName: c.authorName.split(' ')[0] ?? c.authorName, lastName: c.authorName.split(' ').slice(1).join(' '), role: 'technician' as const, organizationId: '', isActive: true, createdAt: c.createdAt },
      content: c.content, isInternal: false, createdAt: c.createdAt, updatedAt: c.updatedAt,
    })),
    history: dto.history.map((h) => ({
      id: h.id, ticketId: dto.id, authorId: h.userId,
      author: { id: h.userId, email: '', firstName: h.userName.split(' ')[0] ?? h.userName, lastName: h.userName.split(' ').slice(1).join(' '), role: 'technician' as const, organizationId: '', isActive: true, createdAt: h.createdAt },
      field: h.field, oldValue: h.oldValue, newValue: h.newValue, createdAt: h.createdAt,
    })),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  }
}

export const getTickets = async (filters: TicketFilters = {}): Promise<PaginatedResponse<Ticket>> => {
  const response = await apiClient.get<PagedResult<TicketDto>>('/api/tickets', { params: filters })
  const data = response.data
  return { items: data.items.map(mapTicketDto), total: data.totalCount, page: data.page, pageSize: data.pageSize, totalPages: Math.ceil(data.totalCount / data.pageSize) }
}

export const getTicket = async (id: string): Promise<Ticket> => {
  const response = await apiClient.get<TicketDto>(`/api/tickets/${id}`)
  return mapTicketDto(response.data)
}

export const createTicket = async (data: Partial<Ticket>): Promise<Ticket> => {
  const response = await apiClient.post<TicketDto>('/api/tickets', data)
  return mapTicketDto(response.data)
}

export const updateTicket = async (id: string, data: Partial<Ticket>): Promise<Ticket> => {
  const response = await apiClient.put<TicketDto>(`/api/tickets/${id}`, data)
  return mapTicketDto(response.data)
}

export const deleteTicket = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/tickets/${id}`)
}

export const addComment = async (ticketId: string, content: string, isInternal = false): Promise<TicketComment> => {
  const response = await apiClient.post<{ id: string; authorId: string; authorName: string; content: string; createdAt: string; updatedAt: string }>(
    `/api/tickets/${ticketId}/comments`, { content, isInternal }
  )
  const c = response.data
  return { id: c.id, ticketId, authorId: c.authorId, author: { id: c.authorId, email: '', firstName: c.authorName.split(' ')[0] ?? c.authorName, lastName: c.authorName.split(' ').slice(1).join(' '), role: 'technician' as const, organizationId: '', isActive: true, createdAt: c.createdAt }, content: c.content, isInternal: false, createdAt: c.createdAt, updatedAt: c.updatedAt }
}

export const changeStatus = async (ticketId: string, status: TicketStatus): Promise<Ticket> => {
  const response = await apiClient.patch<TicketDto>(`/api/tickets/${ticketId}/status`, { status })
  return mapTicketDto(response.data)
}

