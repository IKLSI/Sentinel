import { ROUTES_API } from "@/configs/api-routes.gen";
import { useGetQuery } from "@/domains/helpers";
import {
  AVAILABLE_REPOS_QUERY_KEY,
  PROJECTS_QUERY_KEY,
  projectQueryKey,
} from "@/domains/projects/constants";
import type { AvailableRepos, Project } from "@/domains/projects/types";

export const useProjectsQuery = (enabled = true) =>
  useGetQuery<Project[]>(
    ROUTES_API.api.techHealth.projects.__path,
    {},
    {
      queryKey: PROJECTS_QUERY_KEY,
      enabled,
    },
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
