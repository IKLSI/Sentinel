import { createFileRoute } from "@tanstack/react-router";
import { queryClient } from "@/configs/queryClient";
import { ticketQueryOptions } from "@/domains/tickets/queries";
import { TicketDetailPage } from "@/features/tickets/pages/TicketDetailPage";

export const Route = createFileRoute("/_authenticated/tickets/$id")({
  loader: ({ context, params }) => {
    if (!context.auth.isAuthenticated) return;
    void queryClient.prefetchQuery(ticketQueryOptions(params.id));
  },
  component: TicketDetailPage,
});
