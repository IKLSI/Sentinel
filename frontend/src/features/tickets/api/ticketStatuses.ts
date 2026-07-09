import apiClient from "../../../services/client";

export interface TicketStatusDef {
  id: string;
  name: string;
  color: string;
  order: number;
  isDefault: boolean;
  isClosed: boolean;
  ticketCount: number;
}

export const getTicketStatuses = async (
  signal?: AbortSignal,
): Promise<TicketStatusDef[]> => {
  const response = await apiClient.get<TicketStatusDef[]>("/api/statuses", {
    signal,
  });
  return response.data;
};

export const changeTicketStatus = async (
  ticketId: string,
  statusId: string,
): Promise<void> => {
  await apiClient.patch(`/api/tickets/${ticketId}/status`, { statusId });
};
