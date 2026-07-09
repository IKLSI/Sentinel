import { useQuery } from "@tanstack/react-query";
import { getProjects, type ProjectDto } from "../api/projects";

export const projectsQueryKey = ["projects"] as const;

export const useProjects = (enabled = true) => {
  return useQuery<ProjectDto[]>({
    queryKey: projectsQueryKey,
    queryFn: () => getProjects(),
    enabled,
    staleTime: 60_000,
  });
};
