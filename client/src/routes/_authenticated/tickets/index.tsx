import { createFileRoute } from "@tanstack/react-router";
import { TicketsPage } from "@/features/tickets/pages/TicketsPage";
import { TicketPriority, TicketStatus, TicketType } from "@/enums";

type TicketsSearch = {
  openCreate?: boolean;
  priority?: TicketPriority;
  status?: TicketStatus;
  type?: TicketType;
};

const matchEnum = <T extends string>(
  allowed: readonly T[],
  value: unknown,
): T | undefined => (allowed.includes(value as T) ? (value as T) : undefined);

export const Route = createFileRoute("/_authenticated/tickets/")({
  validateSearch: (search: Record<string, unknown>): TicketsSearch => ({
    openCreate: search.openCreate === true ? true : undefined,
    priority: matchEnum(Object.values(TicketPriority), search.priority),
    status: matchEnum(Object.values(TicketStatus), search.status),
    type: matchEnum(Object.values(TicketType), search.type),
  }),
  component: TicketsPage,
});
