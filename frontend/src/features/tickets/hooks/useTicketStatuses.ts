import { useMutation } from "@tanstack/react-query";
import { changeTicketStatus } from "../api/ticketStatuses";

export const useChangeTicketStatus = () => {
  return useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: string; status: string }) =>
      changeTicketStatus(ticketId, status),
  });
};
