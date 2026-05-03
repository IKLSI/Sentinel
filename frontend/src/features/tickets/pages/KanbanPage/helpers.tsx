import React from "react";
import BugReportOutlined from "@mui/icons-material/BugReportOutlined";
import AutoFixHighOutlined from "@mui/icons-material/AutoFixHighOutlined";
import SecurityOutlined from "@mui/icons-material/SecurityOutlined";
import SpeedOutlined from "@mui/icons-material/SpeedOutlined";
import BuildOutlined from "@mui/icons-material/BuildOutlined";
import HelpOutlineOutlined from "@mui/icons-material/HelpOutlineOutlined";
import { Ticket, TicketPriority } from "@/types";
import type { TicketStatusDef } from "../../api/ticketStatuses";

type KanbanType =
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

export type KanbanColumns = Record<string, KanbanTicket[]>;

export interface ProjectInfo {
  name: string;
  ticketCount: number;
}

export interface KanbanColumnDef {
  id: string;
  name: string;
  color: string;
  subtle: string;
  border: string;
  isDefault: boolean;
  isClosed: boolean;
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

export function apiColToColDef(c: TicketStatusDef): KanbanColumnDef {
  return {
    id: c.id,
    name: c.name,
    color: c.color,
    subtle: `color-mix(in srgb, ${c.color} 10%, transparent)`,
    border: `color-mix(in srgb, ${c.color} 28%, transparent)`,
    isDefault: c.isDefault,
    isClosed: c.isClosed,
  };
}

function emptyColumns(columnDefs: KanbanColumnDef[]): KanbanColumns {
  return Object.fromEntries(columnDefs.map((c) => [c.id, []]));
}

export function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr];
  const [removed] = result.splice(from, 1);
  result.splice(to, 0, removed);
  return result;
}

function ticketToKanban(t: Ticket): KanbanTicket {
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

export function ticketsToColumns(
  tickets: Ticket[],
  columnDefs: KanbanColumnDef[],
): KanbanColumns {
  const cols = emptyColumns(columnDefs);
  const colIds = new Set(columnDefs.map((c) => c.id));

  for (const t of tickets) {
    if (t.statusId && colIds.has(t.statusId)) {
      cols[t.statusId].push(ticketToKanban(t));
    }
  }
  return cols;
}

export function projectInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const avatarPalette: { bg: string; text: string }[] = [
  {
    bg: "linear-gradient(135deg, color-mix(in srgb, var(--purple) 18%, white), color-mix(in srgb, var(--purple) 32%, white))",
    text: "color-mix(in srgb, var(--purple) 75%, black)",
  },
  {
    bg: "linear-gradient(135deg, color-mix(in srgb, var(--green) 18%, white), color-mix(in srgb, var(--green) 32%, white))",
    text: "color-mix(in srgb, var(--green) 75%, black)",
  },
  {
    bg: "linear-gradient(135deg, color-mix(in srgb, var(--red) 16%, white), color-mix(in srgb, var(--red) 28%, white))",
    text: "color-mix(in srgb, var(--red) 70%, black)",
  },
  {
    bg: "linear-gradient(135deg, color-mix(in srgb, var(--orange) 18%, white), color-mix(in srgb, var(--orange) 32%, white))",
    text: "color-mix(in srgb, var(--orange) 75%, black)",
  },
  {
    bg: "linear-gradient(135deg, color-mix(in srgb, var(--cyan) 18%, white), color-mix(in srgb, var(--cyan) 32%, white))",
    text: "color-mix(in srgb, var(--cyan) 75%, black)",
  },
  {
    bg: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 18%, white), color-mix(in srgb, var(--accent) 32%, white))",
    text: "color-mix(in srgb, var(--accent) 75%, black)",
  },
  {
    bg: "linear-gradient(135deg,#f6ced5,#eaa8b6)",
    text: "#8b1c38",
  },
  {
    bg: "linear-gradient(135deg, color-mix(in srgb, var(--yellow) 22%, white), color-mix(in srgb, var(--yellow) 38%, white))",
    text: "color-mix(in srgb, var(--yellow) 75%, black)",
  },
];

export function getAvatarColor(name: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return avatarPalette[Math.abs(hash) % avatarPalette.length];
}

export function toggleItem<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

export const CUSTOM_COLUMN_COLORS = [
  "var(--purple)",
  "var(--cyan)",
  "var(--orange)",
  "var(--green)",
  "var(--red)",
  "var(--yellow)",
  "var(--accent)",
  "var(--muted2)",
];
