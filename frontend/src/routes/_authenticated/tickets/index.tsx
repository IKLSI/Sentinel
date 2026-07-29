import { createFileRoute } from "@tanstack/react-router";
import { TicketsPage } from "@/features/tickets/pages/TicketsPage";

type TicketsSearch = { openCreate?: boolean };

export const Route = createFileRoute("/_authenticated/tickets/")({
  validateSearch: (search: Record<string, unknown>): TicketsSearch => ({
    openCreate: search.openCreate === true ? true : undefined,
  }),
  component: TicketsPage,
});
