import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Ticket, TicketFilters } from "../../../types";
import {
  createTicket,
  deleteTicket,
  exportTicketsExcel,
  getTickets,
  updateTicket,
} from "../api/tickets";
import { dashboardQueryKey } from "@/features/dashboard/hooks/useDashboard";
import { ticketQueryKey } from "./useTicket";

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

export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TICKETS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
    },
  });
};

export const useUpdateTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Ticket> }) =>
      updateTicket(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(ticketQueryKey(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: [TICKETS_QUERY_KEY] });
      window.dispatchEvent(new Event("dashboard:refresh"));
    },
  });
};

export const useDeleteTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TICKETS_QUERY_KEY] });
      window.dispatchEvent(new Event("dashboard:refresh"));
    },
  });
};

export const useExportTicketsExcel = () => {
  return useMutation({
    mutationFn: exportTicketsExcel,
  });
};
