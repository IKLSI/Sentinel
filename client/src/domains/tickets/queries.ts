import { ROUTES_API } from "@/configs/api-routes.gen";
import { getQueryOptions, useGetQuery } from "@/domains/helpers";
import { ticketQueryKey, ticketsQueryKey } from "@/domains/tickets/constants";
import type {
  Ticket,
  TicketFilters,
  TicketPagedResult,
} from "@/domains/tickets/types";

export const useTicketsQuery = (filters: TicketFilters, enabled = true) =>
  useGetQuery<TicketPagedResult>(
    ROUTES_API.api.tickets.__path,
    {},
    {
      queryKey: ticketsQueryKey(filters),
      enabled,
      placeholderData: (previous) => previous,
    },
    filters,
  );

export const ticketQueryOptions = (id: string) =>
  getQueryOptions<Ticket>(
    ROUTES_API.api.tickets[":id"].__path,
    ticketQueryKey(id),
    { id },
  );

export const useTicketQuery = (id: string | undefined) =>
  useGetQuery<Ticket>(
    ROUTES_API.api.tickets[":id"].__path,
    { id },
    {
      queryKey: ticketQueryKey(id ?? ""),
      enabled: !!id,
    },
  );
