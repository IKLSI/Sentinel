import React from "react";
import BugReportOutlined from "@mui/icons-material/BugReportOutlined";
import AutoFixHighOutlined from "@mui/icons-material/AutoFixHighOutlined";
import SecurityOutlined from "@mui/icons-material/SecurityOutlined";
import SpeedOutlined from "@mui/icons-material/SpeedOutlined";
import BuildOutlined from "@mui/icons-material/BuildOutlined";
import HelpOutlineOutlined from "@mui/icons-material/HelpOutlineOutlined";
import { Ticket, TicketPriority, TicketStatus } from "@/types";

export type KanbanType =
  | "bug"
  | "feature"
  | "security"
  | "performance"
  | "maintenance"
  | "question";

export interface KanbanTicket {
  id: string;
  reference: string;
  title: string;
  project: string;
  priority: TicketPriority;
  type: KanbanType;
  assigneeInitials?: string;
  assigneeName?: string;
  isInternal: boolean;
  commentCount: number;
}

export type KanbanColumns = Record<TicketStatus, KanbanTicket[]>;

export interface ProjectInfo {
  name: string;
  ticketCount: number;
}

export const typeLabelKeys: Record<KanbanType, string> = {
  bug: "tickets.kanban.type.bug",
  feature: "tickets.kanban.type.feature",
  security: "tickets.kanban.type.security",
  performance: "tickets.kanban.type.performance",
  maintenance: "tickets.kanban.type.maintenance",
  question: "tickets.kanban.type.question",
};

export const typeIcons: Record<KanbanType, React.ReactElement> = {
  bug: <BugReportOutlined sx={{ fontSize: 11 }} />,
  feature: <AutoFixHighOutlined sx={{ fontSize: 11 }} />,
  security: <SecurityOutlined sx={{ fontSize: 11 }} />,
  performance: <SpeedOutlined sx={{ fontSize: 11 }} />,
  maintenance: <BuildOutlined sx={{ fontSize: 11 }} />,
  question: <HelpOutlineOutlined sx={{ fontSize: 11 }} />,
};

export const columnMeta: Record<
  TicketStatus,
  { labelKey: string; color: string; subtle: string; border: string }
> = {
  new: {
    labelKey: "tickets.kanban.status.new",
    color: "var(--accent)",
    subtle: "var(--accent-subtle)",
    border: "var(--accent-border)",
  },
  in_progress: {
    labelKey: "tickets.kanban.status.in_progress",
    color: "var(--orange)",
    subtle: "var(--orange-subtle)",
    border: "rgba(249,115,22,0.28)",
  },
  testing: {
    labelKey: "tickets.kanban.status.testing",
    color: "var(--cyan)",
    subtle: "var(--cyan-subtle)",
    border: "rgba(6,182,212,0.28)",
  },
  resolved: {
    labelKey: "tickets.kanban.status.resolved",
    color: "var(--green)",
    subtle: "var(--green-subtle)",
    border: "rgba(34,197,94,0.28)",
  },
  closed: {
    labelKey: "tickets.kanban.status.closed",
    color: "var(--muted2)",
    subtle: "rgba(116,136,170,0.10)",
    border: "rgba(116,136,170,0.22)",
  },
};

export const columnOrder: TicketStatus[] = [
  "new",
  "in_progress",
  "testing",
  "resolved",
  "closed",
];

export const emptyColumns = (): KanbanColumns => ({
  new: [],
  in_progress: [],
  testing: [],
  resolved: [],
  closed: [],
});

export function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr];
  const [removed] = result.splice(from, 1);
  result.splice(to, 0, removed);
  return result;
}

export function ticketToKanban(t: Ticket): KanbanTicket {
  const a = t.assignee;
  const initials = a
    ? `${a.firstName[0] ?? ""}${a.lastName[0] ?? ""}`.toUpperCase()
    : undefined;
  return {
    id: t.id,
    reference: t.reference,
    title: t.title,
    project: t.projectName ?? "",
    priority: t.priority,
    type: t.type as KanbanType,
    assigneeInitials: initials,
    assigneeName: a ? `${a.firstName} ${a.lastName}` : undefined,
    isInternal: t.isInternal,
    commentCount: t.comments.length,
  };
}

export function ticketsToColumns(tickets: Ticket[]): KanbanColumns {
  const cols = emptyColumns();
  for (const t of tickets) {
    if (cols[t.status]) cols[t.status].push(ticketToKanban(t));
  }
  return cols;
}

export function projectInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export const avatarPalette = [
  "#7c3aed",
  "#059669",
  "#dc2626",
  "#b45309",
  "#0891b2",
  "#be185d",
  "#4f46e5",
  "#16a34a",
  "#9333ea",
  "#d97706",
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return avatarPalette[Math.abs(hash) % avatarPalette.length];
}

export function toggleItem<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}
