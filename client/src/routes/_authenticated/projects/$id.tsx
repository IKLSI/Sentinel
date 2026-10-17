import { createFileRoute } from "@tanstack/react-router";
import { queryClient } from "@/configs/queryClient";
import { projectQueryOptions } from "@/domains/projects/queries";
import { ProjectDetailPage } from "@/features/techHealth/pages/ProjectDetailPage";

export const Route = createFileRoute("/_authenticated/projects/$id")({
  loader: ({ context, params }) => {
    if (!context.auth.isAuthenticated) return;
    void queryClient.prefetchQuery(projectQueryOptions(params.id));
  },
  component: ProjectDetailPage,
});
