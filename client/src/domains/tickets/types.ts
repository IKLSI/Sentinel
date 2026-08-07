import type { components } from "@/types/api.gen";
import type { SortDirection, TicketSortField } from "@/enums";

export type Ticket = components["schemas"]["TicketDto"];

export type TicketComment = components["schemas"]["TicketCommentDto"];

export type TicketHistory = components["schemas"]["TicketHistoryDto"];

export type TicketAttachment = components["schemas"]["TicketAttachmentDto"];

export type TicketPagedResult = components["schemas"]["TicketDtoPagedResult"];

export type CreateTicket = components["schemas"]["CreateTicketDto"];

export type UpdateTicket = components["schemas"]["UpdateTicketDto"];

export type CreateComment = components["schemas"]["CreateCommentDto"];

export type TicketCriteriaFilters = {
  priority?: string[];
  status?: string[];
  type?: string[];
  assignedTo?: string[];
  project?: string[];
  search?: string;
};

export type TicketFilters = TicketCriteriaFilters & {
  page?: number;
  pageSize?: number;
  sortBy?: TicketSortField;
  sortDirection?: SortDirection;
};

export type TicketExportFilters = TicketCriteriaFilters;
