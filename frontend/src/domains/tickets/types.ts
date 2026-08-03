import type { components } from "@/types/api.gen";
import type {
  SortDirection,
  TicketPriority,
  TicketSortField,
  TicketStatus,
  TicketType,
} from "@/enums";

export type Ticket = components["schemas"]["TicketDto"];

export type TicketComment = components["schemas"]["TicketCommentDto"];

export type TicketHistory = components["schemas"]["TicketHistoryDto"];

export type TicketAttachment = components["schemas"]["TicketAttachmentDto"];

export type TicketPagedResult = components["schemas"]["TicketDtoPagedResult"];

export type CreateTicket = components["schemas"]["CreateTicketDto"];

export type UpdateTicket = components["schemas"]["UpdateTicketDto"];

export type CreateComment = components["schemas"]["CreateCommentDto"];

export type TicketFilters = {
  priority?: TicketPriority;
  status?: TicketStatus | string;
  assignedTo?: string;
  type?: TicketType;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: TicketSortField;
  sortDirection?: SortDirection;
};

export type TicketExportFilters = Omit<
  TicketFilters,
  "page" | "pageSize" | "sortBy" | "sortDirection"
>;
