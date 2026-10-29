import type React from "react";
import BugReportOutlined from "@mui/icons-material/BugReportOutlined";
import AutoFixHighOutlined from "@mui/icons-material/AutoFixHighOutlined";
import SecurityOutlined from "@mui/icons-material/SecurityOutlined";
import SpeedOutlined from "@mui/icons-material/SpeedOutlined";
import BuildOutlined from "@mui/icons-material/BuildOutlined";
import HelpOutlineOutlined from "@mui/icons-material/HelpOutlineOutlined";
import type { TicketPriority, TicketType } from "@/enums";
import type { Ticket, UpdateTicket } from "@/domains/tickets/types";
import type { CreateTicketFormValues } from "@/features/tickets/pages/TicketsPage/schemas";

export const EMPTY_CREATE_TICKET_FORM: CreateTicketFormValues = {
  title: "",
  description: "",
  priority: "Medium",
  type: "Bug",
};

export const toTicketRestore = (ticket: Ticket): UpdateTicket => ({
  title: ticket.title,
  description: ticket.description,
  priority: ticket.priority as UpdateTicket["priority"],
  type: ticket.type as UpdateTicket["type"],
  status: ticket.status,
  projectId: ticket.projectId,
  assignedToId: ticket.assignedToId,
  clearProject: !ticket.projectId,
  clearAssignee: !ticket.assignedToId,
});

export const priorityLabelKeys: Record<TicketPriority, string> = {
  critical: "tickets.list.priority_critical",
  high: "tickets.list.priority_high",
  medium: "tickets.list.priority_medium",
  low: "tickets.list.priority_low",
};

const typeBadgeStyle: Record<TicketType, { bg: string; color: string }> = {
  bug: {
    bg: "color-mix(in srgb, var(--red) 12%, transparent)",
    color: "var(--red)",
  },
  feature: { bg: "var(--accent-subtle)", color: "var(--accent)" },
  security: {
    bg: "color-mix(in srgb, var(--orange) 12%, transparent)",
    color: "var(--orange)",
  },
  performance: {
    bg: "color-mix(in srgb, var(--cyan) 12%, transparent)",
    color: "var(--cyan)",
  },
  maintenance: {
    bg: "color-mix(in srgb, var(--muted2) 10%, transparent)",
    color: "var(--muted2)",
  },
  question: {
    bg: "color-mix(in srgb, var(--yellow) 12%, transparent)",
    color: "var(--yellow)",
  },
};

const typeIcons: Record<TicketType, React.ReactElement> = {
  bug: <BugReportOutlined sx={{ fontSize: 12 }} />,
  feature: <AutoFixHighOutlined sx={{ fontSize: 12 }} />,
  security: <SecurityOutlined sx={{ fontSize: 12 }} />,
  performance: <SpeedOutlined sx={{ fontSize: 12 }} />,
  maintenance: <BuildOutlined sx={{ fontSize: 12 }} />,
  question: <HelpOutlineOutlined sx={{ fontSize: 12 }} />,
};

export const typeTooltipKeys: Record<TicketType, string> = {
  bug: "tickets.list.type_bug",
  feature: "tickets.list.type_feature",
  security: "tickets.list.type_security",
  performance: "tickets.list.type_performance",
  maintenance: "tickets.list.type_maintenance",
  question: "tickets.list.type_question",
};

const FALLBACK_COLOR = "var(--muted2)";
const FALLBACK_BADGE_STYLE = { bg: "transparent", color: FALLBACK_COLOR };

export const priorityLabelKeyOf = (priority: string): string =>
  priorityLabelKeys[priority as TicketPriority] ?? priority;

export const typeTooltipKeyOf = (type: string): string =>
  typeTooltipKeys[type as TicketType] ?? type;

export const typeBadgeStyleOf = (type: string) =>
  typeBadgeStyle[type as TicketType] ?? FALLBACK_BADGE_STYLE;

export const typeIconOf = (type: string): React.ReactElement | null =>
  typeIcons[type as TicketType] ?? null;
