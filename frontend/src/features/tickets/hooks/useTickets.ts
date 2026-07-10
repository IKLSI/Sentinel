import { useQuery } from "@tanstack/react-query";
import type { TicketFilters } from "../../../types";
import { getTickets } from "../api/tickets";

export const TICKETS_QUERY_KEY = "tickets";

const ticketsQueryKey = (filters: TicketFilters) =>
  [TICKETS_QUERY_KEY, filters] as const;

export const useTickets = (filters: TicketFilters, enabled = true) => {
  const query = useQuery({
    queryKey: ticketsQueryKey(filters),
    queryFn: ({ signal }) => getTickets(filters, signal),
    enabled,
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });

  return {
    tickets: query.data ?? null,
    loading: query.isLoading,
    error: query.error ? "tickets.list.error_loading" : null,
    refetch: query.refetch,
  };
};
