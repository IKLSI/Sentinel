import { useMutation, useQuery } from "@tanstack/react-query";
import {
  downloadComplianceReport,
  downloadSbom,
  getProject,
  type ProjectDetailDto,
  type SbomFormat,
} from "../api/projects";

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

export const useDownloadSbom = () => {
  return useMutation({
    mutationFn: ({
      projectId,
      projectName,
      format,
    }: {
      projectId: string;
      projectName: string;
      format: SbomFormat;
    }) => downloadSbom(projectId, projectName, format),
  });
};

export const useDownloadComplianceReport = () => {
  return useMutation({
    mutationFn: ({
      projectId,
      projectName,
    }: {
      projectId: string;
      projectName: string;
    }) => downloadComplianceReport(projectId, projectName),
  });
};
