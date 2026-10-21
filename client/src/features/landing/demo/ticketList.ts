import type { FilterCriterion } from "@/components/ui/forms/FilterBuilder/types";
import type { Ticket } from "@/domains/tickets/types";
import {
  SortDirection,
  TicketPriority,
  TicketSortField,
  type TicketStatus,
} from "@/enums";
import { TICKET_STATUSES } from "@/features/tickets/constants";
import {
  TICKET_FILTER_FIELDS,
  UNSET_FILTER_VALUE,
} from "@/features/tickets/pages/TicketsPage/filterParams";
import type { SortState } from "@/features/tickets/pages/TicketsPage/components/TicketsTable";

const PRIORITY_ORDER: string[] = [
  TicketPriority.Low,
  TicketPriority.Medium,
  TicketPriority.High,
  TicketPriority.Critical,
];

const criterionValueOf: Record<string, (ticket: Ticket) => string> = {
  [TICKET_FILTER_FIELDS.priority]: (ticket) => ticket.priority,
  [TICKET_FILTER_FIELDS.status]: (ticket) => ticket.status,
  [TICKET_FILTER_FIELDS.type]: (ticket) => ticket.type,
  [TICKET_FILTER_FIELDS.assignedTo]: (ticket) =>
    ticket.assignedToId ?? UNSET_FILTER_VALUE,
  [TICKET_FILTER_FIELDS.project]: (ticket) =>
    ticket.projectId ?? UNSET_FILTER_VALUE,
};

const comparators: Record<TicketSortField, (a: Ticket, b: Ticket) => number> = {
  [TicketSortField.Title]: (a, b) => a.title.localeCompare(b.title),
  [TicketSortField.Priority]: (a, b) =>
    PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
  [TicketSortField.Status]: (a, b) =>
    TICKET_STATUSES.indexOf(a.status as TicketStatus) -
    TICKET_STATUSES.indexOf(b.status as TicketStatus),
  [TicketSortField.Assignee]: (a, b) =>
    (a.assignedToName ?? "").localeCompare(b.assignedToName ?? ""),
  [TicketSortField.Comments]: (a, b) => a.commentCount - b.commentCount,
};

const matchesSearch = (ticket: Ticket, term: string) =>
  [ticket.title, ticket.reference, ticket.projectName ?? ""].some((value) =>
    value.toLowerCase().includes(term),
  );

const matchesCriterion = (
  ticket: Ticket,
  criterion: FilterCriterion | null,
) => {
  const readValue = criterion ? criterionValueOf[criterion.field] : undefined;
  if (!criterion?.values.length || !readValue) return true;
  return criterion.values.includes(readValue(ticket));
};

export const selectDemoTickets = (
  tickets: Ticket[],
  search: string,
  criterion: FilterCriterion | null,
  sort: SortState,
): Ticket[] => {
  const term = search.trim().toLowerCase();
  const direction = sort.dir === SortDirection.Asc ? 1 : -1;
  return tickets
    .filter(
      (ticket) =>
        (!term || matchesSearch(ticket, term)) &&
        matchesCriterion(ticket, criterion),
    )
    .sort((a, b) => comparators[sort.col](a, b) * direction);
};
