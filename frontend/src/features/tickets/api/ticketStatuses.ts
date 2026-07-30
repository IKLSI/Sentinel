import apiClient from "../../../services/client";

export const changeTicketStatus = async (
  ticketId: string,
  status: string,
): Promise<void> => {
  await apiClient.patch(`/api/tickets/${ticketId}/status`, { status });
};
