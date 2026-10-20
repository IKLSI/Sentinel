import type { QueryKey } from "@tanstack/react-query";
import { API_KEYS_QUERY_KEY } from "@/domains/apiKeys/constants";
import { DASHBOARD_QUERY_KEY } from "@/domains/dashboard/constants";
import { JOBS_QUERY_KEY } from "@/domains/jobs/constants";
import { projectKeys } from "@/domains/projects/constants";
import {
  INTEGRATIONS_QUERY_KEY,
  ORGANIZATION_QUERY_KEY,
} from "@/domains/settings/constants";
import { ticketKeys } from "@/domains/tickets/constants";
import { USERS_QUERY_KEY } from "@/domains/users/constants";
import { REALTIME_RESOURCES } from "@/domains/realtime/contract.gen";
import type { RealtimeEvent } from "@/domains/realtime/types";

export const REALTIME_RETRY_BASE_DELAY_MS = 5_000;

export const REALTIME_RETRY_MAX_DELAY_MS = 60_000;

export const REALTIME_INVALIDATION_BATCH_MS = 300;

const reportUnhandledResource = (resource: never): QueryKey[] => {
  console.warn("Unhandled realtime resource:", resource);
  return [];
};

const affectedProjectDetailKeys = (projectIds?: string[]): QueryKey[] =>
  projectIds ? projectIds.map(projectKeys.detail) : [projectKeys.details()];

export const resolveInvalidatedKeys = ({
  resource,
  id,
  projectIds,
}: RealtimeEvent): QueryKey[] => {
  switch (resource) {
    case REALTIME_RESOURCES.Projects:
      return [
        projectKeys.list(),
        DASHBOARD_QUERY_KEY,
        projectKeys.availableRepos(),
        projectKeys.options(),
      ];
    case REALTIME_RESOURCES.Project:
      return [
        projectKeys.list(),
        DASHBOARD_QUERY_KEY,
        projectKeys.options(),
        ...(id ? [projectKeys.detail(id)] : []),
      ];
    case REALTIME_RESOURCES.Tickets:
      return [
        ticketKeys.lists(),
        DASHBOARD_QUERY_KEY,
        projectKeys.list(),
        ...affectedProjectDetailKeys(projectIds),
      ];
    case REALTIME_RESOURCES.Ticket:
      return [
        ticketKeys.lists(),
        DASHBOARD_QUERY_KEY,
        projectKeys.list(),
        ...affectedProjectDetailKeys(projectIds),
        ...(id ? [ticketKeys.detail(id)] : []),
      ];
    case REALTIME_RESOURCES.TicketActivity:
      return [
        ticketKeys.lists(),
        DASHBOARD_QUERY_KEY,
        ...(id ? [ticketKeys.detail(id)] : []),
      ];
    case REALTIME_RESOURCES.Jobs:
      return [JOBS_QUERY_KEY];
    case REALTIME_RESOURCES.Users:
      return [[USERS_QUERY_KEY], ticketKeys.lists(), DASHBOARD_QUERY_KEY];
    case REALTIME_RESOURCES.ApiKeys:
      return [API_KEYS_QUERY_KEY];
    case REALTIME_RESOURCES.Organization:
      return [ORGANIZATION_QUERY_KEY];
    case REALTIME_RESOURCES.Integrations:
      return [INTEGRATIONS_QUERY_KEY, projectKeys.availableRepos()];
    default:
      return reportUnhandledResource(resource);
  }
};
