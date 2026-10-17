import { createFileRoute } from "@tanstack/react-router";
import { queryClient } from "@/configs/queryClient";
import { projectsQueryOptions } from "@/domains/projects/queries";
import { ProjectsPage } from "@/features/projects/pages/ProjectsPage";

type ProjectsSearch = { openImport?: boolean };

export const Route = createFileRoute("/_authenticated/projects/")({
  validateSearch: (search: Record<string, unknown>): ProjectsSearch => ({
    openImport: search.openImport === true ? true : undefined,
  }),
  loader: ({ context }) => {
    if (!context.auth.isAuthenticated) return;
    void queryClient.prefetchQuery(projectsQueryOptions);
  },
  component: ProjectsPage,
});
