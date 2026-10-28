export const deploymentKeys = {
  all: ["deployments"] as const,
  refs: (projectId: string) =>
    [...deploymentKeys.all, "refs", projectId] as const,
  comparison: (projectId: string, base: string, head: string) =>
    [...deploymentKeys.all, "comparison", projectId, base, head] as const,
};
