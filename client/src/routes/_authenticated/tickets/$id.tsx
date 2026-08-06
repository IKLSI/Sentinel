import { createFileRoute } from "@tanstack/react-router";
import { TicketDetailPage } from "@/features/tickets/pages/TicketDetailPage";

export const Route = createFileRoute("/_authenticated/tickets/$id")({
  component: TicketDetailPage,
});
