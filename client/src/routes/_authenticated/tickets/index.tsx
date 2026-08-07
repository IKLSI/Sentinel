import { createFileRoute } from "@tanstack/react-router";
import { TicketsPage } from "@/features/tickets/pages/TicketsPage";
import {
  sanitizeTicketFiltersSearch,
  type TicketFiltersSearch,
} from "@/features/tickets/pages/TicketsPage/filterParams";

type TicketsSearch = TicketFiltersSearch & {
  openCreate?: boolean;
};

export const Route = createFileRoute("/_authenticated/tickets/")({
  validateSearch: (search: Record<string, unknown>): TicketsSearch => ({
    openCreate: search.openCreate === true ? true : undefined,
    ...sanitizeTicketFiltersSearch(search),
  }),
  component: TicketsPage,
});
