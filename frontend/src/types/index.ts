export type UserRole = 'Admin' | 'Developer'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  organizationId: string
  avatarUrl?: string
  createdAt: string
  isActive: boolean
  theme?: 'dark' | 'light'
  lastLoginAt?: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export type TicketPriority = 'critical' | 'high' | 'medium' | 'low'
export type TicketType = 'bug' | 'feature' | 'security' | 'performance' | 'maintenance' | 'question'
export type TicketStatus = 'new' | 'in_progress' | 'testing' | 'resolved' | 'closed'

export interface TicketComment {
  id: string
  ticketId: string
  authorId: string
  author: User
  content: string
  isInternal: boolean
  createdAt: string
  updatedAt: string
}

export interface TicketHistory {
  id: string
  ticketId: string
  authorId: string
  author: User
  field: string
  oldValue?: string
  newValue?: string
  createdAt: string
}

export interface Ticket {
  id: string
  reference: string
  title: string
  description: string
  projectId?: string
  projectName?: string
  assigneeId?: string
  assignee?: User
  priority: TicketPriority
  type: TicketType
  status: TicketStatus
  isInternal: boolean
  estimatedHours?: number
  timeSpentMinutes?: number
  comments: TicketComment[]
  history: TicketHistory[]
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

export type HealthGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface TicketFilters {
  priority?: TicketPriority
  status?: TicketStatus
  assigneeId?: string
  type?: TicketType
  search?: string
  page?: number
  pageSize?: number
}

