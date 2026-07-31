import { TicketStatus } from "@/enums";

export const TICKET_STATUSES: TicketStatus[] = [
  TicketStatus.New,
  TicketStatus.InProgress,
  TicketStatus.Testing,
  TicketStatus.Resolved,
  TicketStatus.Closed,
];

export const statusLabelKeys: Record<TicketStatus, string> = {
  [TicketStatus.New]: "tickets.status.new",
  [TicketStatus.InProgress]: "tickets.status.in_progress",
  [TicketStatus.Testing]: "tickets.status.testing",
  [TicketStatus.Resolved]: "tickets.status.resolved",
  [TicketStatus.Closed]: "tickets.status.closed",
};

const statusColors: Record<TicketStatus, string> = {
  [TicketStatus.New]: "var(--accent)",
  [TicketStatus.InProgress]: "var(--orange)",
  [TicketStatus.Testing]: "var(--cyan)",
  [TicketStatus.Resolved]: "var(--green)",
  [TicketStatus.Closed]: "var(--muted2)",
};

export const statusLabel = (
  t: (key: string) => string,
  status?: string | null,
): string => {
  const labelKey = statusLabelKeys[status as TicketStatus];
  return labelKey ? t(labelKey) : (status ?? "—");
};

export const statusColor = (status?: string | null): string =>
  statusColors[status as TicketStatus] ?? "var(--muted2)";
