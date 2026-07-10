import { useQuery } from "@tanstack/react-query";
import { getProject, type ProjectDetailDto } from "../api/projects";

export const useProject = (id: string | undefined) => {
  const query = useQuery<ProjectDetailDto>({
    queryKey: ["project", id ?? ""],
    queryFn: ({ signal }) => getProject(id as string, signal),
    enabled: !!id,
    staleTime: 30_000,
  });

  return {
    project: query.data ?? null,
    loading: query.isLoading,
    error: query.isError,
  };
};
