import type { TicketFilters } from "@/domains/tickets/types";

export const TICKETS_QUERY_KEY = "tickets";

const TICKET_QUERY_KEY = "ticket";

export const ticketsQueryKey = (filters: TicketFilters) =>
  [TICKETS_QUERY_KEY, filters] as const;

export const ticketQueryKey = (id: string) => [TICKET_QUERY_KEY, id] as const;

export const TICKETS_EXPORT_FILE_PREFIX = "tickets";
