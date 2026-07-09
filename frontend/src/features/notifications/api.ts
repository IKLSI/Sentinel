import apiClient from "../../services/client";

export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  ticketId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  items: NotificationItem[];
  unreadCount: number;
}

export async function fetchNotifications(): Promise<NotificationsResponse> {
  const res = await apiClient.get<NotificationsResponse>("/api/notifications");
  return res.data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.patch(`/api/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch("/api/notifications/read-all");
}
