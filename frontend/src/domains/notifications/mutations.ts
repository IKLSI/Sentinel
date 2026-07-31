import { ROUTES_API } from "@/configs/api-routes.gen";
import { invalidateKeys, usePatchMutation } from "@/domains/helpers";
import { NOTIFICATIONS_QUERY_KEY } from "@/domains/notifications/constants";

const invalidateNotifications = () => invalidateKeys([NOTIFICATIONS_QUERY_KEY]);

export const useMarkNotificationReadMutation = () =>
  usePatchMutation<void, void, { id: string }>(
    ROUTES_API.api.notifications[":id"].read.__path,
    { onSuccess: invalidateNotifications },
  );

export const useMarkAllNotificationsReadMutation = () =>
  usePatchMutation<void, void, Record<string, never>>(
    ROUTES_API.api.notifications.readAll.__path,
    { onSuccess: invalidateNotifications },
  );
