import { createFileRoute } from "@tanstack/react-router";
import { ProjectDetailPage } from "@/features/techHealth/pages/ProjectDetailPage";

export const Route = createFileRoute("/_authenticated/projects/$id")({
  component: ProjectDetailPage,
});
