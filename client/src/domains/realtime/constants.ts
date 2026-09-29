import type { QueryKey } from "@tanstack/react-query";
import { API_KEYS_QUERY_KEY } from "@/domains/apiKeys/constants";
import { DASHBOARD_QUERY_KEY } from "@/domains/dashboard/constants";
import { JOBS_QUERY_KEY } from "@/domains/jobs/constants";
import {
  PROJECTS_QUERY_KEY,
  projectQueryKey,
} from "@/domains/projects/constants";
import {
  INTEGRATIONS_QUERY_KEY,
  ORGANIZATION_QUERY_KEY,
} from "@/domains/settings/constants";
import { TICKETS_QUERY_KEY, ticketQueryKey } from "@/domains/tickets/constants";
import { USERS_QUERY_KEY } from "@/domains/users/constants";
import { REALTIME_RESOURCES } from "@/domains/realtime/contract.gen";
import type { RealtimeEvent } from "@/domains/realtime/types";

export const REALTIME_RETRY_BASE_DELAY_MS = 5_000;

export const REALTIME_RETRY_MAX_DELAY_MS = 60_000;

const reportUnhandledResource = (resource: never): QueryKey[] => {
  console.warn("Unhandled realtime resource:", resource);
  return [];
};

export const resolveInvalidatedKeys = ({
  resource,
  id,
}: RealtimeEvent): QueryKey[] => {
  switch (resource) {
    case REALTIME_RESOURCES.Projects:
      return [PROJECTS_QUERY_KEY, DASHBOARD_QUERY_KEY];
    case REALTIME_RESOURCES.Project:
      return [
        PROJECTS_QUERY_KEY,
        DASHBOARD_QUERY_KEY,
        ...(id ? [projectQueryKey(id)] : []),
      ];
    case REALTIME_RESOURCES.Tickets:
      return [[TICKETS_QUERY_KEY], DASHBOARD_QUERY_KEY, PROJECTS_QUERY_KEY];
    case REALTIME_RESOURCES.Ticket:
      return [
        [TICKETS_QUERY_KEY],
        DASHBOARD_QUERY_KEY,
        PROJECTS_QUERY_KEY,
        ...(id ? [ticketQueryKey(id)] : []),
      ];
    case REALTIME_RESOURCES.Jobs:
      return [JOBS_QUERY_KEY];
    case REALTIME_RESOURCES.Users:
      return [[USERS_QUERY_KEY]];
    case REALTIME_RESOURCES.ApiKeys:
      return [API_KEYS_QUERY_KEY];
    case REALTIME_RESOURCES.Organization:
      return [ORGANIZATION_QUERY_KEY];
    case REALTIME_RESOURCES.Integrations:
      return [INTEGRATIONS_QUERY_KEY];
    default:
      return reportUnhandledResource(resource);
  }
};
