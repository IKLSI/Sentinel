export type { UserRole, TicketPriority, TicketType } from './enums';
import type { Theme, Language, UserRole, TicketPriority, TicketType } from './enums';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
  avatarUrl?: string;
  createdAt: string;
  isActive: boolean;
  theme?: Theme;
  language?: Language;
  lastLoginAt?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}


export interface TicketStatusDef {
  id: string;
  name: string;
  color: string;
  order: number;
  isDefault: boolean;
  isClosed: boolean;
  ticketCount: number;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  author: User;
  content: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TicketHistory {
  id: string;
  ticketId: string;
  authorId: string;
  author: User;
  field: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  reference: string;
  title: string;
  description: string;
  projectId?: string;
  projectName?: string;
  assigneeId?: string;
  assignee?: User;
  priority: TicketPriority;
  type: TicketType;
  statusId: string;
  statusName: string;
  statusColor: string;
  statusIsClosed: boolean;
  isInternal: boolean;
  estimatedHours?: number;
  timeSpentMinutes?: number;
  comments: TicketComment[];
  history: TicketHistory[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}


export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TicketFilters {
  priority?: TicketPriority;
  status?: string;
  assigneeId?: string;
  type?: TicketType;
  search?: string;
  page?: number;
  pageSize?: number;
}
