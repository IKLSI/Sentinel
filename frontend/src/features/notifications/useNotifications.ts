import { useCallback, useEffect, useMemo, useRef } from "react";
import { queryClient } from "@/configs/queryClient";
import { NOTIFICATIONS_QUERY_KEY } from "@/domains/notifications/constants";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/domains/notifications/mutations";
import { useNotificationsQuery } from "@/domains/notifications/queries";
import type {
  NotificationItem,
  NotificationsResponse,
} from "@/domains/notifications/types";
import { useNotificationHub } from "@/features/notifications/useNotificationHub";

export function useNotifications() {
  const { data } = useNotificationsQuery();

  useNotificationHub((incoming) => {
    queryClient.setQueryData<NotificationsResponse>(
      NOTIFICATIONS_QUERY_KEY,
      (previous) => ({
        items: [incoming, ...(previous?.items ?? [])],
        unreadCount: (previous?.unreadCount ?? 0) + 1,
      }),
    );
  });

  const items: NotificationItem[] = useMemo(() => data?.items ?? [], [data]);
  const unreadCount = data?.unreadCount ?? 0;

  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  });

  const runMarkRead = markRead.mutate;
  const markReadByTicketId = useCallback(
    (ticketId: string) => {
      const notification = itemsRef.current.find(
        (item) => !item.isRead && item.ticketId === ticketId,
      );
      if (notification) runMarkRead({ id: notification.id });
    },
    [runMarkRead],
  );

  const runMarkAllRead = markAllRead.mutate;
  const markAllAsRead = useCallback(() => runMarkAllRead({}), [runMarkAllRead]);

  return {
    items,
    unreadCount,
    markReadByTicketId,
    markAllRead: markAllAsRead,
  };
}
