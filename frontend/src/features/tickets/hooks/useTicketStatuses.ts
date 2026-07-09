import { useQuery } from "@tanstack/react-query";
import { getTicketStatuses, type TicketStatusDef } from "../api/ticketStatuses";

export const ticketStatusesQueryKey = ["ticket-statuses"] as const;

export const useTicketStatuses = (enabled = true) => {
  return useQuery<TicketStatusDef[]>({
    queryKey: ticketStatusesQueryKey,
    queryFn: ({ signal }) => getTicketStatuses(signal),
    enabled,
    staleTime: 5 * 60_000,
  });
};
