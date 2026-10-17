import { ROUTES_API } from "@/configs/api-routes.gen";
import { getQueryOptions, useGetQuery } from "@/domains/helpers";
import {
  AVAILABLE_REPOS_QUERY_KEY,
  PROJECT_OPTIONS_QUERY_KEY,
  PROJECTS_QUERY_KEY,
  projectQueryKey,
} from "@/domains/projects/constants";
import type {
  AvailableRepos,
  Project,
  ProjectOption,
  ProjectSummary,
} from "@/domains/projects/types";

export const projectsQueryOptions = getQueryOptions<ProjectSummary[]>(
  ROUTES_API.api.techHealth.projects.__path,
  PROJECTS_QUERY_KEY,
);

export const projectQueryOptions = (id: string) =>
  getQueryOptions<Project>(
    ROUTES_API.api.techHealth.projects[":id"].__path,
    projectQueryKey(id),
    { id },
  );

export const useProjectsQuery = (enabled = true) =>
  useGetQuery<ProjectSummary[]>(
    ROUTES_API.api.techHealth.projects.__path,
    {},
    {
      queryKey: PROJECTS_QUERY_KEY,
      enabled,
    },
  );

export const useProjectOptionsQuery = () =>
  useGetQuery<ProjectOption[]>(
    ROUTES_API.api.techHealth.projects.options.__path,
    {},
    { queryKey: PROJECT_OPTIONS_QUERY_KEY },
  );

export const useProjectQuery = (id: string | undefined) =>
  useGetQuery<Project>(
    ROUTES_API.api.techHealth.projects[":id"].__path,
    { id },
    {
      queryKey: projectQueryKey(id ?? ""),
      enabled: !!id,
    },
  );

export const useAvailableReposQuery = (enabled: boolean) =>
  useGetQuery<AvailableRepos>(
    ROUTES_API.api.techHealth.projects.availableRepos.__path,
    {},
    { queryKey: AVAILABLE_REPOS_QUERY_KEY, enabled },
  );
