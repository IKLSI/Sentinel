import { useQuery } from "@tanstack/react-query";
import { getTicket } from "../api/tickets";

export const ticketQueryKey = (id: string) => ["ticket", id] as const;

export const useTicket = (id: string | undefined) => {
  const query = useQuery({
    queryKey: ticketQueryKey(id ?? ""),
    queryFn: ({ signal }) => getTicket(id as string, signal),
    enabled: !!id,
    staleTime: 15_000,
  });

  return {
    ticket: query.data ?? null,
    loading: query.isLoading,
    notFound: query.isError,
  };
};
