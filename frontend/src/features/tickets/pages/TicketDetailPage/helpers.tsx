import { format } from "date-fns";
import { type Locale } from "date-fns/locale";
import { Ticket, TicketHistory } from "@/types";

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
  commentTime: string;
  iconBtnIdle: string;
  iconBtnEditHoverBg: string;
  iconBtnEditHoverFg: string;
  iconBtnDelHoverBg: string;
  iconBtnDelHoverFg: string;
  commentBorderExternal: string;
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

export const buildPalette = (_isDark: boolean): DetailPalette => ({
  panelBg: "var(--s1)",
  panelBorder: "var(--border)",
  panelShadow: "0 1px 2px rgba(0,0,0,0.18), 0 12px 30px -18px rgba(0,0,0,0.3)",
  breadcrumbText: "var(--text-secondary)",
  folderIcon: "var(--purple)",
  chevron: "var(--muted)",
  referenceText: "var(--text-secondary)",
  muted: "var(--muted2)",
  strongText: "var(--text-secondary)",
  title: "var(--text)",
  endpointFg: "var(--purple)",
  endpointBg:
    "linear-gradient(180deg, var(--purple-subtle) 0%, color-mix(in srgb, var(--purple) 6%, transparent) 100%)",
  endpointBorder: "color-mix(in srgb, var(--purple) 35%, transparent)",
  endpointIcon: "var(--purple)",
  sectionDivider: "var(--border)",
  sectionLabel: "var(--muted2)",
  descFallback: "var(--muted2)",
  threadLine: "var(--border)",
  commentAuthor: "var(--text)",
  commentTime: "var(--muted2)",
  iconBtnIdle: "var(--muted2)",
  iconBtnEditHoverBg: "var(--s2)",
  iconBtnEditHoverFg: "var(--text)",
  iconBtnDelHoverBg: "color-mix(in srgb, var(--red) 18%, transparent)",
  iconBtnDelHoverFg: "var(--red)",
  commentBorderExternal: "var(--border)",
  commentBgExternal: "var(--s2)",
  emptyFg: "var(--muted2)",
  emptySub: "var(--muted)",
  tabStripBg: "var(--s3)",
  tabStripBorder: "var(--border)",
  tabActiveFg: "var(--text)",
  tabIdleFg: "var(--text-secondary)",
  tabActiveBg: "var(--s1)",
  tabActiveShadow: "0 1px 2px rgba(0,0,0,0.18)",
  composerBorder: "var(--border)",
  composerBg: "var(--s1)",
  composerDivider: "var(--border)",
  toolbarIdle: "var(--muted2)",
  toolbarHoverBg: "var(--s2)",
  toolbarHoverFg: "var(--text-secondary)",
  sendBtnGradient:
    "linear-gradient(180deg, var(--accent) 0%, var(--accent2) 100%)",
  fieldRowHover: "var(--s2)",
  fieldLabel: "var(--muted2)",
  fieldValue: "var(--text)",
  fieldSep: "var(--border)",
  discChevron: "var(--muted)",
  typeIcon: "var(--text-secondary)",
  historyTimeline:
    "linear-gradient(180deg, var(--border) 0%, var(--border) 80%, transparent 100%)",
  historyDotBorder: "var(--s1)",
  historyMsg: "var(--text)",
  historySub: "var(--muted2)",
  inputBg: "var(--s1)",
  inputBorder: "var(--border)",
  inputText: "var(--text)",
  inputFocusBorder: "var(--accent)",
  inputFocusRing: "var(--accent-border)",
  mdText: "var(--text-secondary)",
  mdInlineCodeBg: "var(--s3)",
  mdInlineCodeBorder: "var(--border)",
  mdInlineCodeFg: "var(--text)",
  mdPreBg: "var(--bg)",
  mdPreBorder: "var(--border)",
  mdPreFg: "var(--text)",
  mdStrong: "var(--text)",
});

export const buildStatusConfig = (
  _isDark: boolean,
): Record<string, { labelKey: string; color: string; dot: string }> => ({});

export const buildPriorityConfig = (
  _isDark: boolean,
): Record<string, { labelKey: string; color: string; dot: string }> => ({
  critical: {
    labelKey: "tickets.detail.priority_critical",
    color: "var(--red)",
    dot: "var(--red)",
  },
  high: {
    labelKey: "tickets.detail.priority_high",
    color: "var(--orange)",
    dot: "var(--orange)",
  },
  medium: {
    labelKey: "tickets.detail.priority_medium",
    color: "var(--yellow)",
    dot: "var(--yellow)",
  },
  low: {
    labelKey: "tickets.detail.priority_low",
    color: "var(--green)",
    dot: "var(--green)",
  },
});

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
      borderRadius: 'var(--r-sm)',
      px: "6px",
      py: "2px",
      color: p.mdInlineCodeFg,
    },
    "& pre": {
      mt: "14px",
      mb: "6px",
      borderRadius: 'var(--r-lg)',
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
    borderRadius: 'var(--r-lg)',
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

type TFn = (k: string, v?: Record<string, string | number>) => string;

export function getRelativeShort(date: string, t: TFn, locale: Locale) {
  const diff = Math.max(0, Date.now() - new Date(date).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return t("tickets.detail.relative_now");
  if (min < 60) return t("tickets.detail.relative_minutes", { n: min });
  const hours = Math.floor(min / 60);
  if (hours < 24) return t("tickets.detail.relative_hours", { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t("tickets.detail.relative_days", { n: days });
  return format(new Date(date), "dd MMM", { locale });
}

function normalizeStatusKey(value?: string) {
  if (!value) return "";
  const compact = value.trim().toLowerCase().replace(/[\s-]/g, "_");
  if (compact === "inprogress") return "in_progress";
  return compact;
}

function normalizePriorityKey(value?: string) {
  if (!value) return "";
  return value.trim().toLowerCase().replace(/[\s-]/g, "_");
}

function mapStatusLabel(
  value: string | undefined,
  t: TFn,
  statusConfig: ReturnType<typeof buildStatusConfig>,
) {
  if (!value) return "—";
  const key = normalizeStatusKey(value);
  const labelKey = statusConfig[key]?.labelKey;
  return labelKey ? t(labelKey) : value;
}

function mapPriorityLabel(
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
  ticket?: Ticket,
) {
  void isDark;
  const tones = {
    created: {
      dot: "var(--red)",
      ring: "color-mix(in srgb, var(--red) 20%, transparent)",
    },
    status: {
      dot: "var(--yellow)",
      ring: "color-mix(in srgb, var(--yellow) 20%, transparent)",
    },
    assign: {
      dot: "var(--purple)",
      ring: "color-mix(in srgb, var(--purple) 22%, transparent)",
    },
    priority: {
      dot: "var(--red)",
      ring: "color-mix(in srgb, var(--red) 22%, transparent)",
    },
    default: {
      dot: "var(--green)",
      ring: "color-mix(in srgb, var(--green) 20%, transparent)",
    },
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
    const raw = entry.newValue ?? "";
    const uuidLike =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    let nameLabel = raw || t("tickets.detail.unassigned");
    if (raw && uuidLike.test(raw)) {
      if (ticket && ticket.assignee && ticket.assignee.id === raw) {
        nameLabel = `${ticket.assignee.firstName} ${ticket.assignee.lastName}`;
      } else {
        nameLabel = `${raw.slice(0, 8)}…`;
      }
    }
    return {
      tone: tones.assign,
      message: t("tickets.detail.history_assigned", {
        name: nameLabel,
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
