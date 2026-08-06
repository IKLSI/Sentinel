import { createFileRoute } from "@tanstack/react-router";
import { OrganisationPage } from "@/features/settings/pages/OrganisationPage";

export const Route = createFileRoute("/_authenticated/_admin/organisation")({
  component: OrganisationPage,
});
