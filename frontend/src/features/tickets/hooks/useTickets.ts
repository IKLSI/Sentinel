import { useQuery } from "@tanstack/react-query";
import { TicketFilters } from "../../../types";
import { getTickets } from "../api/tickets";

export const ticketsQueryKey = (filters: TicketFilters) => ["tickets", filters] as const;

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
    loading: query.isLoading || query.isFetching,
    error: query.error ? "tickets.list.error_loading" : null,
    refetch: query.refetch,
  };
};
