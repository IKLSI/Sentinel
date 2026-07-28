import { useMutation, useQuery } from "@tanstack/react-query";
import {
  changeTicketStatus,
  getTicketStatuses,
  type TicketStatusDef,
} from "../api/ticketStatuses";

const ticketStatusesQueryKey = ["ticket-statuses"] as const;

export const useTicketStatuses = (enabled = true) => {
  return useQuery<TicketStatusDef[]>({
    queryKey: ticketStatusesQueryKey,
    queryFn: ({ signal }) => getTicketStatuses(signal),
    enabled,
    staleTime: 5 * 60_000,
  });
};

export const useChangeTicketStatus = () => {
  return useMutation({
    mutationFn: ({
      ticketId,
      statusId,
    }: {
      ticketId: string;
      statusId: string;
    }) => changeTicketStatus(ticketId, statusId),
  });
};
