import React from "react";
import BugReportOutlined from "@mui/icons-material/BugReportOutlined";
import AutoFixHighOutlined from "@mui/icons-material/AutoFixHighOutlined";
import SecurityOutlined from "@mui/icons-material/SecurityOutlined";
import SpeedOutlined from "@mui/icons-material/SpeedOutlined";
import BuildOutlined from "@mui/icons-material/BuildOutlined";
import HelpOutlineOutlined from "@mui/icons-material/HelpOutlineOutlined";
import { TicketPriority, TicketType } from "@/types";

export interface CreateTicketPayload {
  title: string;
  description: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  type:
    | "Bug"
    | "Feature"
    | "Security"
    | "Performance"
    | "Maintenance"
    | "Question";
  projectId?: string;
  assignedToId?: string;
  estimatedHours?: number;
  isInternal: boolean;
}

export function getPageNumbers(
  page: number,
  totalPages: number,
): (number | "...")[] {
  if (totalPages <= 3)
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1, 2];
  if (page > 3) pages.push("...");
  if (page > 2 && page < totalPages) pages.push(page);
  if (page < totalPages - 1) pages.push("...");
  if (!pages.includes(totalPages)) pages.push(totalPages);
  return pages;
}

export const navBtnSx = (disabled: boolean) => ({
  all: "unset" as const,
  cursor: disabled ? "default" : "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  height: "32px",
  px: "12px",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: 600,
  color: disabled ? "var(--muted)" : "var(--text-secondary)",
  background: "var(--s2)",
  border: "1px solid var(--border)",
  opacity: disabled ? 0.4 : 1,
  pointerEvents: disabled ? "none" : "auto",
  transition: "background 0.12s, border-color 0.12s, color 0.12s",
  ...(!disabled && {
    "&:hover": {
      background: "var(--s3)",
      borderColor: "var(--border2)",
      color: "var(--text)",
    },
  }),
});

export const pageBtnSx = (active: boolean) => ({
  all: "unset" as const,
  cursor: active ? "default" : "pointer",
  minWidth: "32px",
  height: "32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: active ? 700 : 500,
  color: active ? "var(--s1)" : "var(--text-secondary)",
  background: active ? "var(--accent)" : "transparent",
  boxShadow: active ? "0 2px 8px var(--accent-border)" : "none",
  transition: "background 0.12s, color 0.12s, box-shadow 0.12s",
  ...(!active && {
    "&:hover": { background: "var(--s2)", color: "var(--text)" },
  }),
});

export const priorityLabelKeys: Record<TicketPriority, string> = {
  critical: "tickets.list.priority_critical",
  high: "tickets.list.priority_high",
  medium: "tickets.list.priority_medium",
  low: "tickets.list.priority_low",
};

export const typeBadgeStyle: Record<TicketType, { bg: string; color: string }> =
  {
    bug: { bg: "color-mix(in srgb, var(--red) 12%, transparent)", color: "var(--red)" },
    feature: { bg: "var(--accent-subtle)", color: "var(--accent)" },
    security: { bg: "color-mix(in srgb, var(--orange) 12%, transparent)", color: "var(--orange)" },
    performance: { bg: "color-mix(in srgb, var(--cyan) 12%, transparent)", color: "var(--cyan)" },
    maintenance: { bg: "color-mix(in srgb, var(--muted2) 10%, transparent)", color: "var(--muted2)" },
    question: { bg: "color-mix(in srgb, var(--yellow) 12%, transparent)", color: "var(--yellow)" },
  };

export const typeIcons: Record<TicketType, React.ReactElement> = {
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

export const priorityColor: Record<TicketPriority, string> = {
  critical: "var(--red)",
  high: "var(--orange)",
  medium: "var(--accent)",
  low: "var(--green)",
};

const avatarPalette = [
  { bg: "color-mix(in srgb, var(--accent) 18%, transparent)", color: "var(--accent)" },
  { bg: "color-mix(in srgb, var(--green) 15%, transparent)", color: "var(--green)" },
  { bg: "color-mix(in srgb, var(--purple) 15%, transparent)", color: "var(--purple)" },
  { bg: "color-mix(in srgb, var(--cyan) 15%, transparent)", color: "var(--cyan)" },
  { bg: "color-mix(in srgb, var(--orange) 15%, transparent)", color: "var(--orange)" },
];

export const getAvatarStyle = (id: string) =>
  avatarPalette[id.charCodeAt(0) % avatarPalette.length];

export const selectSx = {
  appearance: "none",
  WebkitAppearance: "none",
  background: "var(--s1)",
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  border: "1px solid var(--border)",
  borderRadius: "var(--r)",
  px: "12px",
  py: "7px",
  pr: "36px",
  fontSize: "13px",
  color: "var(--text)",
  width: "auto",
  outline: "none",
  fontFamily: "inherit",
};

export const modalSelectSx = {
  appearance: "none",
  WebkitAppearance: "none",
  background: "var(--s1)",
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  border: "1px solid var(--border)",
  borderRadius: "var(--r)",
  px: "12px",
  py: "7px",
  pr: "36px",
  fontSize: "13px",
  color: "var(--text)",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
};

export const modalInputSx = {
  background: "var(--s1)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r)",
  px: "12px",
  py: "8px",
  fontSize: "13px",
  color: "var(--text)",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
};

export const modalTextareaSx = {
  ...modalInputSx,
  resize: "vertical",
  boxSizing: "border-box",
  maxWidth: "100%",
  minHeight: "80px",
  maxHeight: "300px",
};

export const PRIORITY_ORDER: Record<TicketPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};
