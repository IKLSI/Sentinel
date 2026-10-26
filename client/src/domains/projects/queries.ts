import { keepPreviousData } from "@tanstack/react-query";
import { ROUTES_API } from "@/configs/api-routes.gen";
import { getQueryOptions, useGetQuery } from "@/domains/helpers";
import { projectKeys } from "@/domains/projects/constants";
import type {
  AvailableRepos,
  Dependency,
  ProjectOption,
  ProjectOverview,
  ProjectRepositoryOptions,
  ProjectSearchMatch,
  ProjectSummary,
  ScanProgress,
} from "@/domains/projects/types";

export const projectsQueryOptions = getQueryOptions<ProjectSummary[]>(
  ROUTES_API.api.techHealth.projects.__path,
  projectKeys.list(),
);

export const projectOverviewQueryOptions = (id: string) =>
  getQueryOptions<ProjectOverview>(
    ROUTES_API.api.techHealth.projects[":id"].overview.__path,
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

export const useProjectSearchQuery = (query: string) =>
  useGetQuery<ProjectSearchMatch[]>(
    ROUTES_API.api.techHealth.projects.search.__path,
    {},
    {
      queryKey: projectKeys.search(query),
      enabled: query.length > 0,
      placeholderData: keepPreviousData,
      retry: false,
    },
    { q: query },
  );

export const useScanProgressQuery = () =>
  useGetQuery<ScanProgress[]>(
    ROUTES_API.api.techHealth.projects.scanProgress.__path,
    {},
    { queryKey: projectKeys.scanProgress() },
  );

export const useProjectOptionsQuery = () =>
  useGetQuery<ProjectOption[]>(
    ROUTES_API.api.techHealth.projects.options.__path,
    {},
    { queryKey: projectKeys.options() },
  );

export const useProjectOverviewQuery = (id: string | undefined) =>
  useGetQuery<ProjectOverview>(
    ROUTES_API.api.techHealth.projects[":id"].overview.__path,
    { id },
    {
      queryKey: projectKeys.detail(id ?? ""),
      enabled: !!id,
    },
  );

export const useDependenciesWithoutVulnerabilitiesQuery = (id: string) =>
  useGetQuery<Dependency[]>(
    ROUTES_API.api.techHealth.projects[":id"].dependencies
      .withoutVulnerabilities.__path,
    { id },
    { queryKey: projectKeys.dependencies(id) },
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
