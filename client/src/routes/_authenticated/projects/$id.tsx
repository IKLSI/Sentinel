import { createFileRoute } from "@tanstack/react-router";
import { queryClient } from "@/configs/queryClient";
import { projectOverviewQueryOptions } from "@/domains/projects/queries";
import { ProjectDetailPage } from "@/features/projects/pages/ProjectDetailPage";
import {
  type ProjectDetailSearch,
  sanitizeProjectDetailSearch,
} from "@/features/projects/pages/ProjectDetailPage/searchParams";

export const Route = createFileRoute("/_authenticated/projects/$id")({
  validateSearch: (search: Record<string, unknown>): ProjectDetailSearch =>
    sanitizeProjectDetailSearch(search),
  loader: ({ context, params }) => {
    if (!context.auth.isAuthenticated) return;
    void queryClient.prefetchQuery(projectOverviewQueryOptions(params.id));
  },
  component: ProjectDetailPage,
});
