import { PRIORITY_TONES } from "@/constants/severities";

export const DETAIL_PALETTE = {
  panelBg: "var(--s1)",
  panelBorder: "var(--border)",
  panelShadow: "var(--sh-1)",
  chevron: "var(--muted)",
  muted: "var(--muted2)",
  title: "var(--text)",
  sectionDivider: "var(--border)",
  sectionLabel: "var(--muted2)",
  threadLine: "var(--border)",
  commentAuthor: "var(--text)",
  commentTime: "var(--muted2)",
  commentBorderExternal: "var(--border)",
  commentBgExternal: "var(--s2)",
  emptyFg: "var(--muted2)",
  emptySub: "var(--muted)",
  fieldLabel: "var(--muted2)",
  fieldValue: "var(--text)",
  fieldSep: "var(--border)",
  historyTimeline:
    "linear-gradient(180deg, var(--border) 0%, var(--border) 80%, transparent 100%)",
  historyDotBorder: "var(--s1)",
  historyMsg: "var(--text)",
  historySub: "var(--muted2)",
  bodyText: "var(--text-secondary)",
} as const;

export const PRIORITY_CONFIG: Record<
  string,
  { labelKey: string; color: string; dot: string }
> = {
  critical: {
    labelKey: "tickets.detail.priority_critical",
    color: PRIORITY_TONES.critical,
    dot: PRIORITY_TONES.critical,
  },
  high: {
    labelKey: "tickets.detail.priority_high",
    color: PRIORITY_TONES.high,
    dot: PRIORITY_TONES.high,
  },
  medium: {
    labelKey: "tickets.detail.priority_medium",
    color: PRIORITY_TONES.medium,
    dot: PRIORITY_TONES.medium,
  },
  low: {
    labelKey: "tickets.detail.priority_low",
    color: PRIORITY_TONES.low,
    dot: PRIORITY_TONES.low,
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

export const HISTORY_TONES = {
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
} as const;
