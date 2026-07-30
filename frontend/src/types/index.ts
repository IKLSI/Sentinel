export type {
  UserRole,
  TicketPriority,
  TicketStatus,
  TicketType,
} from "./enums";
import type {
  Theme,
  Language,
  UserRole,
  TicketPriority,
  TicketStatus,
  TicketType,
} from "./enums";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  isActive: boolean;
  theme?: Theme;
  language?: Language;
  lastLoginAt?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  author: User;
  content: string;
  createdAt: string;
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
  status: TicketStatus;
  estimatedHours?: number;
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
