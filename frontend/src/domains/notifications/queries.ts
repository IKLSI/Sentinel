import { ROUTES_API } from "@/configs/api-routes.gen";
import { useGetQuery } from "@/domains/helpers";
import { NOTIFICATIONS_QUERY_KEY } from "@/domains/notifications/constants";
import type { NotificationsResponse } from "@/domains/notifications/types";

export const useNotificationsQuery = () =>
  useGetQuery<NotificationsResponse>(
    ROUTES_API.api.notifications.__path,
    {},
    { queryKey: NOTIFICATIONS_QUERY_KEY },
  );
