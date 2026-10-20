import { keepPreviousData } from "@tanstack/react-query";
import { ROUTES_API } from "@/configs/api-routes.gen";
import { getQueryOptions, useGetQuery } from "@/domains/helpers";
import { projectKeys } from "@/domains/projects/constants";
import type {
  AvailableRepos,
  Project,
  ProjectOption,
  ProjectRepositoryOptions,
  ProjectSummary,
} from "@/domains/projects/types";

export const projectsQueryOptions = getQueryOptions<ProjectSummary[]>(
  ROUTES_API.api.techHealth.projects.__path,
  projectKeys.list(),
);

export const projectQueryOptions = (id: string) =>
  getQueryOptions<Project>(
    ROUTES_API.api.techHealth.projects[":id"].__path,
    projectKeys.detail(id),
    { id },
  );

export const useProjectsQuery = (enabled = true) =>
  useGetQuery<ProjectSummary[]>(
    ROUTES_API.api.techHealth.projects.__path,
    {},
    {
      queryKey: projectKeys.list(),
      enabled,
    },
  );

export const useProjectOptionsQuery = () =>
  useGetQuery<ProjectOption[]>(
    ROUTES_API.api.techHealth.projects.options.__path,
    {},
    { queryKey: projectKeys.options() },
  );

export const useProjectQuery = (id: string | undefined) =>
  useGetQuery<Project>(
    ROUTES_API.api.techHealth.projects[":id"].__path,
    { id },
    {
      queryKey: projectKeys.detail(id ?? ""),
      enabled: !!id,
    },
  );

export const useAvailableReposQuery = (enabled: boolean) =>
  useGetQuery<AvailableRepos>(
    ROUTES_API.api.techHealth.projects.availableRepos.__path,
    {},
    { queryKey: projectKeys.availableRepos(), enabled },
  );

export const useProjectRepositoryOptionsQuery = (
  id: string,
  branch: string | null,
  enabled: boolean,
) =>
  useGetQuery<ProjectRepositoryOptions>(
    ROUTES_API.api.techHealth.projects[":id"].repositoryOptions.__path,
    { id, branch },
    {
      queryKey: projectKeys.repositoryOptions(id, branch),
      enabled,
      placeholderData: keepPreviousData,
    },
  );
