import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TicketHistory, TicketStatus } from "@/types";

export interface DetailPalette {
  panelBg: string;
  panelBorder: string;
  panelShadow: string;
  breadcrumbText: string;
  folderIcon: string;
  chevron: string;
  referenceText: string;
  muted: string;
  strongText: string;
  title: string;
  endpointFg: string;
  endpointBg: string;
  endpointBorder: string;
  endpointIcon: string;
  sectionDivider: string;
  sectionLabel: string;
  descFallback: string;
  threadLine: string;
  commentAuthor: string;
  internalBadgeFg: string;
  commentTime: string;
  iconBtnIdle: string;
  iconBtnEditHoverBg: string;
  iconBtnEditHoverFg: string;
  iconBtnDelHoverBg: string;
  iconBtnDelHoverFg: string;
  commentBorderInternal: string;
  commentBorderExternal: string;
  commentBgInternal: string;
  commentBgExternal: string;
  emptyFg: string;
  emptySub: string;
  tabStripBg: string;
  tabStripBorder: string;
  tabActiveFg: string;
  tabIdleFg: string;
  tabActiveBg: string;
  tabActiveShadow: string;
  composerBorder: string;
  composerBg: string;
  composerDivider: string;
  toolbarIdle: string;
  toolbarHoverBg: string;
  toolbarHoverFg: string;
  sendBtnGradient: string;
  fieldRowHover: string;
  fieldLabel: string;
  fieldValue: string;
  fieldSep: string;
  discChevron: string;
  typeIcon: string;
  historyTimeline: string;
  historyDotBorder: string;
  historyMsg: string;
  historySub: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputFocusBorder: string;
  inputFocusRing: string;
  mdText: string;
  mdInlineCodeBg: string;
  mdInlineCodeBorder: string;
  mdInlineCodeFg: string;
  mdPreBg: string;
  mdPreBorder: string;
  mdPreFg: string;
  mdStrong: string;
}

export const buildPalette = (isDark: boolean): DetailPalette =>
  isDark
    ? {
        panelBg: "#0d1120",
        panelBorder: "#1e2a42",
        panelShadow:
          "0 1px 2px rgba(0,0,0,0.4), 0 12px 30px -18px rgba(0,0,0,0.6)",
        breadcrumbText: "#a0aec9",
        folderIcon: "#a78bfa",
        chevron: "#4d5e82",
        referenceText: "#cbd5e1",
        muted: "#7488aa",
        strongText: "#cbd5e1",
        title: "#e6eaf6",
        endpointFg: "#c4b5fd",
        endpointBg:
          "linear-gradient(180deg, rgba(139,92,246,0.18) 0%, rgba(139,92,246,0.10) 100%)",
        endpointBorder: "rgba(168,85,247,0.35)",
        endpointIcon: "#a78bfa",
        sectionDivider: "#1e2a42",
        sectionLabel: "#7488aa",
        descFallback: "#7488aa",
        threadLine: "#1e2a42",
        commentAuthor: "#e6eaf6",
        internalBadgeFg: "#fbbf24",
        commentTime: "#7488aa",
        iconBtnIdle: "#7488aa",
        iconBtnEditHoverBg: "rgba(255,255,255,0.05)",
        iconBtnEditHoverFg: "#e6eaf6",
        iconBtnDelHoverBg: "rgba(239,68,68,0.18)",
        iconBtnDelHoverFg: "#f87171",
        commentBorderInternal: "rgba(245,158,11,0.35)",
        commentBorderExternal: "#1e2a42",
        commentBgInternal: "rgba(245,158,11,0.08)",
        commentBgExternal: "#121829",
        emptyFg: "#7488aa",
        emptySub: "#4d5e82",
        tabStripBg: "#192036",
        tabStripBorder: "#1e2a42",
        tabActiveFg: "#e6eaf6",
        tabIdleFg: "#a0aec9",
        tabActiveBg: "#0d1120",
        tabActiveShadow: "0 1px 2px rgba(0,0,0,0.5)",
        composerBorder: "#1e2a42",
        composerBg: "#0d1120",
        composerDivider: "#1e2a42",
        toolbarIdle: "#7488aa",
        toolbarHoverBg: "rgba(255,255,255,0.05)",
        toolbarHoverFg: "#cbd5e1",
        sendBtnGradient: "linear-gradient(180deg,#818cf8 0%, #6366f1 100%)",
        fieldRowHover: "rgba(255,255,255,0.04)",
        fieldLabel: "#7488aa",
        fieldValue: "#e6eaf6",
        fieldSep: "#1e2a42",
        discChevron: "#4d5e82",
        typeIcon: "#a0aec9",
        historyTimeline:
          "linear-gradient(180deg, #1e2a42 0%, #1e2a42 80%, transparent 100%)",
        historyDotBorder: "#0d1120",
        historyMsg: "#e6eaf6",
        historySub: "#7488aa",
        inputBg: "#0d1120",
        inputBorder: "#1e2a42",
        inputText: "#e6eaf6",
        inputFocusBorder: "#818cf8",
        inputFocusRing: "rgba(99,102,241,0.25)",
        mdText: "#cbd5e1",
        mdInlineCodeBg: "#192036",
        mdInlineCodeBorder: "#1e2a42",
        mdInlineCodeFg: "#e6eaf6",
        mdPreBg: "#020617",
        mdPreBorder: "#1e2a42",
        mdPreFg: "#e2e8f0",
        mdStrong: "#e6eaf6",
      }
    : {
        panelBg: "#ffffff",
        panelBorder: "#e2e8f0",
        panelShadow:
          "0 1px 2px rgba(15,23,42,0.04), 0 12px 30px -18px rgba(15,23,42,0.18)",
        breadcrumbText: "#64748b",
        folderIcon: "#7c3aed",
        chevron: "#cbd5e1",
        referenceText: "#475569",
        muted: "#94a3b8",
        strongText: "#334155",
        title: "#0f172a",
        endpointFg: "#5b3dd1",
        endpointBg: "linear-gradient(180deg, #f5f3ff 0%, #ede9fe 100%)",
        endpointBorder: "#d8ccff",
        endpointIcon: "#8b5cf6",
        sectionDivider: "#e2e8f0",
        sectionLabel: "#94a3b8",
        descFallback: "#94a3b8",
        threadLine: "#e2e8f0",
        commentAuthor: "#0f172a",
        internalBadgeFg: "#b45309",
        commentTime: "#94a3b8",
        iconBtnIdle: "#94a3b8",
        iconBtnEditHoverBg: "#f1f5f9",
        iconBtnEditHoverFg: "#0f172a",
        iconBtnDelHoverBg: "#fee2e2",
        iconBtnDelHoverFg: "#dc2626",
        commentBorderInternal: "#fde68a",
        commentBorderExternal: "#e2e8f0",
        commentBgInternal: "#fffbeb",
        commentBgExternal: "#f8fafc",
        emptyFg: "#94a3b8",
        emptySub: "#cbd5e1",
        tabStripBg: "#f1f5f9",
        tabStripBorder: "#e2e8f0",
        tabActiveFg: "#0f172a",
        tabIdleFg: "#64748b",
        tabActiveBg: "#ffffff",
        tabActiveShadow: "0 1px 2px rgba(15,23,42,0.08)",
        composerBorder: "#dbe3ef",
        composerBg: "#ffffff",
        composerDivider: "#e2e8f0",
        toolbarIdle: "#94a3b8",
        toolbarHoverBg: "#f1f5f9",
        toolbarHoverFg: "#334155",
        sendBtnGradient: "linear-gradient(180deg,#6d5ef7 0%, #4f46e5 100%)",
        fieldRowHover: "#f8fafc",
        fieldLabel: "#94a3b8",
        fieldValue: "#0f172a",
        fieldSep: "#eef2f7",
        discChevron: "#cbd5e1",
        typeIcon: "#64748b",
        historyTimeline:
          "linear-gradient(180deg, #e2e8f0 0%, #e2e8f0 80%, transparent 100%)",
        historyDotBorder: "#fff",
        historyMsg: "#0f172a",
        historySub: "#94a3b8",
        inputBg: "#ffffff",
        inputBorder: "#dbe3ef",
        inputText: "#0f172a",
        inputFocusBorder: "#a5b4fc",
        inputFocusRing: "rgba(99,102,241,0.15)",
        mdText: "#334155",
        mdInlineCodeBg: "#f1f5f9",
        mdInlineCodeBorder: "#e2e8f0",
        mdInlineCodeFg: "#0f172a",
        mdPreBg: "#020617",
        mdPreBorder: "#0f172a",
        mdPreFg: "#e2e8f0",
        mdStrong: "#0f172a",
      };

export const buildStatusConfig = (
  isDark: boolean,
): Record<TicketStatus, { labelKey: string; color: string; dot: string }> =>
  isDark
    ? {
        new: {
          labelKey: "tickets.detail.status_new",
          color: "#a5b4fc",
          dot: "#818cf8",
        },
        in_progress: {
          labelKey: "tickets.detail.status_in_progress",
          color: "#fb923c",
          dot: "#f97316",
        },
        testing: {
          labelKey: "tickets.detail.status_testing",
          color: "#22d3ee",
          dot: "#06b6d4",
        },
        resolved: {
          labelKey: "tickets.detail.status_resolved",
          color: "#4ade80",
          dot: "#22c55e",
        },
        closed: {
          labelKey: "tickets.detail.status_closed",
          color: "#94a3b8",
          dot: "#64748b",
        },
      }
    : {
        new: {
          labelKey: "tickets.detail.status_new",
          color: "#4f46e5",
          dot: "#818cf8",
        },
        in_progress: {
          labelKey: "tickets.detail.status_in_progress",
          color: "#c2410c",
          dot: "#f97316",
        },
        testing: {
          labelKey: "tickets.detail.status_testing",
          color: "#0e7490",
          dot: "#06b6d4",
        },
        resolved: {
          labelKey: "tickets.detail.status_resolved",
          color: "#15803d",
          dot: "#22c55e",
        },
        closed: {
          labelKey: "tickets.detail.status_closed",
          color: "#475569",
          dot: "#64748b",
        },
      };

export const buildPriorityConfig = (
  isDark: boolean,
): Record<string, { labelKey: string; color: string; dot: string }> =>
  isDark
    ? {
        critical: {
          labelKey: "tickets.detail.priority_critical",
          color: "#fb7185",
          dot: "#f43f5e",
        },
        high: {
          labelKey: "tickets.detail.priority_high",
          color: "#fbbf24",
          dot: "#f59e0b",
        },
        medium: {
          labelKey: "tickets.detail.priority_medium",
          color: "#facc15",
          dot: "#eab308",
        },
        low: {
          labelKey: "tickets.detail.priority_low",
          color: "#4ade80",
          dot: "#22c55e",
        },
      }
    : {
        critical: {
          labelKey: "tickets.detail.priority_critical",
          color: "#be123c",
          dot: "#f43f5e",
        },
        high: {
          labelKey: "tickets.detail.priority_high",
          color: "#b45309",
          dot: "#f59e0b",
        },
        medium: {
          labelKey: "tickets.detail.priority_medium",
          color: "#ca8a04",
          dot: "#eab308",
        },
        low: {
          labelKey: "tickets.detail.priority_low",
          color: "#15803d",
          dot: "#22c55e",
        },
      };

export const typeLabelKeys: Record<string, string> = {
  bug: "tickets.detail.type_bug",
  feature: "tickets.detail.type_feature",
  security: "tickets.detail.type_security",
  performance: "tickets.detail.type_performance",
  maintenance: "tickets.detail.type_maintenance",
  question: "tickets.detail.type_question",
};

export const buildMarkdownSx = (p: DetailPalette) =>
  ({
    fontSize: "13px",
    color: p.mdText,
    lineHeight: 1.7,
    "& p": { m: 0, mb: "10px" },
    "& p:last-child": { mb: 0 },
    "& code": {
      fontFamily: "var(--font-mono)",
      fontSize: "12px",
      background: p.mdInlineCodeBg,
      border: `1px solid ${p.mdInlineCodeBorder}`,
      borderRadius: "7px",
      px: "6px",
      py: "2px",
      color: p.mdInlineCodeFg,
    },
    "& pre": {
      mt: "14px",
      mb: "6px",
      borderRadius: "14px",
      border: `1px solid ${p.mdPreBorder}`,
      background: p.mdPreBg,
      overflow: "auto",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
    },
    "& pre code": {
      display: "block",
      background: "transparent",
      border: "none",
      fontSize: "13px",
      lineHeight: 1.7,
      color: p.mdPreFg,
      p: "14px 18px",
    },
    "& strong": { color: p.mdStrong, fontWeight: 700 },
    "& ul, & ol": { pl: "20px", m: 0 },
  }) as const;

export const buildFieldSx = (p: DetailPalette) =>
  ({
    background: p.inputBg,
    border: `1px solid ${p.inputBorder}`,
    borderRadius: "14px",
    px: "18px",
    py: "14px",
    fontSize: "14px",
    color: p.inputText,
    width: "100%",
    outline: "none",
    fontFamily: "var(--font-ui)",
    boxSizing: "border-box",
    transition: "border-color 0.12s, box-shadow 0.12s",
    "&:focus": {
      borderColor: p.inputFocusBorder,
      boxShadow: `0 0 0 3px ${p.inputFocusRing}`,
    },
  }) as const;

export function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export type TFn = (k: string, v?: Record<string, string | number>) => string;

export function getRelativeShort(date: string, t: TFn) {
  const diff = Math.max(0, Date.now() - new Date(date).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return t("tickets.detail.relative_now");
  if (min < 60) return t("tickets.detail.relative_minutes", { n: min });
  const hours = Math.floor(min / 60);
  if (hours < 24) return t("tickets.detail.relative_hours", { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t("tickets.detail.relative_days", { n: days });
  return format(new Date(date), "dd MMM", { locale: fr });
}

export function normalizeStatusKey(value?: string) {
  if (!value) return "";
  const compact = value.trim().toLowerCase().replace(/[\s-]/g, "_");
  if (compact === "inprogress") return "in_progress";
  return compact;
}

export function normalizePriorityKey(value?: string) {
  if (!value) return "";
  return value.trim().toLowerCase().replace(/[\s-]/g, "_");
}

export function mapStatusLabel(
  value: string | undefined,
  t: TFn,
  statusConfig: ReturnType<typeof buildStatusConfig>,
) {
  if (!value) return "—";
  const key = normalizeStatusKey(value) as TicketStatus;
  const labelKey = statusConfig[key]?.labelKey;
  return labelKey ? t(labelKey) : value;
}

export function mapPriorityLabel(
  value: string | undefined,
  t: TFn,
  priorityConfig: ReturnType<typeof buildPriorityConfig>,
) {
  if (!value) return "—";
  const key = normalizePriorityKey(value);
  const labelKey = priorityConfig[key]?.labelKey;
  return labelKey ? t(labelKey) : value;
}

export function historyPresentation(
  entry: TicketHistory,
  t: TFn,
  isDark: boolean,
  statusConfig: ReturnType<typeof buildStatusConfig>,
  priorityConfig: ReturnType<typeof buildPriorityConfig>,
) {
  const tones = isDark
    ? {
        created: { dot: "#fda4af", ring: "rgba(244,114,182,0.20)" },
        status: { dot: "#fbbf24", ring: "rgba(251,191,36,0.20)" },
        assign: { dot: "#a78bfa", ring: "rgba(167,139,250,0.22)" },
        priority: { dot: "#fb7185", ring: "rgba(251,113,133,0.22)" },
        default: { dot: "#86efac", ring: "rgba(134,239,172,0.20)" },
      }
    : {
        created: { dot: "#fda4af", ring: "#ffe4e6" },
        status: { dot: "#fbbf24", ring: "#fef3c7" },
        assign: { dot: "#a78bfa", ring: "#ede9fe" },
        priority: { dot: "#fb7185", ring: "#ffe4e6" },
        default: { dot: "#86efac", ring: "#dcfce7" },
      };
  const field = entry.field.toLowerCase();
  if (field === "created" || field === "creation" || field.includes("create")) {
    return {
      tone: tones.created,
      message: t("tickets.detail.history_created"),
    };
  }
  if (field.includes("status")) {
    return {
      tone: tones.status,
      message: t("tickets.detail.history_status_change", {
        from: mapStatusLabel(entry.oldValue, t, statusConfig),
        to: mapStatusLabel(entry.newValue, t, statusConfig),
      }),
    };
  }
  if (field.includes("assign")) {
    return {
      tone: tones.assign,
      message: t("tickets.detail.history_assigned", {
        name: entry.newValue ?? t("tickets.detail.unassigned"),
      }),
    };
  }
  if (field.includes("priority")) {
    return {
      tone: tones.priority,
      message: t("tickets.detail.history_priority_change", {
        from: mapPriorityLabel(entry.oldValue, t, priorityConfig),
        to: mapPriorityLabel(entry.newValue, t, priorityConfig),
      }),
    };
  }
  return {
    tone: tones.default,
    message:
      entry.oldValue || entry.newValue
        ? `${entry.field} ${entry.oldValue ?? "—"} → ${entry.newValue ?? "—"}`
        : t("tickets.detail.history_field_updated", { field: entry.field }),
  };
}
