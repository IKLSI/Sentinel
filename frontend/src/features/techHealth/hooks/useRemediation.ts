import { useMutation, useQuery } from "@tanstack/react-query";
import { executeRemediation, getRemediationPreview } from "../api/remediation";

export const useRemediationPreview = (projectId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["remediation-preview", projectId],
    queryFn: ({ signal }) => getRemediationPreview(projectId, signal),
    enabled,
  });
};

export const useExecuteRemediation = () => {
  return useMutation({
    mutationFn: executeRemediation,
  });
};
