export interface Organization {
  id: string
  name: string
  slug: string
  logoUrl?: string
  createdAt: string
}

export type UserRole = 'admin' | 'manager' | 'technician'

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

export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'archived'

export interface Project {
  id: string
  name: string
  description?: string
  status: ProjectStatus
  color?: string
  healthScore?: number
  healthGrade?: HealthGrade
  openTickets: number
  totalTickets: number
  hoursThisMonth: number
  createdAt: string
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
  slaDeadline?: string
  slaBreached: boolean
  estimatedHours?: number
  timeSpentMinutes?: number
  comments: TicketComment[]
  history: TicketHistory[]
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

export interface TimeEntry {
  id: string
  ticketId?: string
  ticket?: Ticket
  userId: string
  user: User
  description: string
  minutes: number
  date: string
  isBillable: boolean
  invoiceId?: string
  createdAt: string
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled' | 'overdue'

export interface InvoiceLine {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Invoice {
  id: string
  reference: string
  recipient: string
  status: InvoiceStatus
  lines: InvoiceLine[]
  totalHT: number
  totalTTC: number
  taxRate: number
  periodStart: string
  periodEnd: string
  issuedAt?: string
  dueAt?: string
  paidAt?: string
  createdAt: string
}

export type HealthGrade = 'A' | 'B' | 'C' | 'D' | 'F'

export interface Dependency {
  id: string
  projectId: string
  name: string
  currentVersion: string
  latestVersion: string
  type: 'production' | 'development'
  updateType: 'ok' | 'minor' | 'major' | 'critical'
  isEol: boolean
}

export type VulnerabilitySeverity = 'critical' | 'high' | 'medium' | 'low'

export interface Vulnerability {
  id: string
  projectId: string
  cveId: string
  title: string
  description: string
  severity: VulnerabilitySeverity
  cvssScore: number
  packageName: string
  packageVersion: string
  fixedVersion?: string
  isIgnored: boolean
  detectedAt: string
}

export interface EnvironmentVersion {
  environment: 'production' | 'staging' | 'dev'
  version: string
  deployedAt: string
  isHealthy: boolean
}

export interface TechProject {
  id: string
  name: string
  healthScore: number
  healthGrade: HealthGrade
  dependencies: Dependency[]
  vulnerabilities: Vulnerability[]
  environments: EnvironmentVersion[]
  lastScannedAt: string
}

export interface AuditLog {
  id: string
  userId: string
  user: User
  action: string
  entityType: string
  entityId: string
  details?: Record<string, unknown>
  ipAddress?: string
  createdAt: string
}

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
  slaBreached?: boolean
  search?: string
  page?: number
  pageSize?: number
}

export interface DashboardStats {
  openTickets: number
  openTicketsDelta: number
  slaRespected: number
  slaRespectedDelta: number
  hoursThisMonth: number
  billableRevenue: number
  unbilledRevenue: number
  criticalVulnerabilities: number
  ticketsByStatus: Record<string, number>
}
