import { createFileRoute } from "@tanstack/react-router";
import { ProjectsPage } from "@/features/projects/pages/ProjectsPage";

type ProjectsSearch = { openImport?: boolean };

export const Route = createFileRoute("/_authenticated/projects/")({
  validateSearch: (search: Record<string, unknown>): ProjectsSearch => ({
    openImport: search.openImport === true ? true : undefined,
  }),
  component: ProjectsPage,
});
