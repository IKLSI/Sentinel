import { format } from "date-fns";
import type { Locale } from "date-fns/locale";
import type { Ticket, TicketHistory } from "@/domains/tickets/types";
import type { CommentAttachment } from "@/components/ui/common/AttachmentChip";
import { statusLabel } from "@/features/tickets/constants";

const ATTACHMENT_SEPARATOR = "<!-- attachments -->";
const IMAGE_LINK_PATTERN = /^!\[(.+?)\]\((.+?)\)$/;
const FILE_LINK_PATTERN = /^\[(.+?)\]\((.+?)\)$/;
const SEPARATOR_PREFIX = "\n\n";

export function parseCommentContent(content: string): {
  text: string;
  attachments: CommentAttachment[];
} {
  const index = content.indexOf(ATTACHMENT_SEPARATOR);
  if (index === -1) return { text: content, attachments: [] };

  const rawText = content.slice(0, index);
  const text = rawText.endsWith(SEPARATOR_PREFIX)
    ? rawText.slice(0, -SEPARATOR_PREFIX.length)
    : rawText.trimEnd();

  const attachments = content
    .slice(index + ATTACHMENT_SEPARATOR.length)
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const image = line.match(IMAGE_LINK_PATTERN);
      if (image) return { fileName: image[1], url: image[2], isImage: true };
      const file = line.match(FILE_LINK_PATTERN);
      if (file) return { fileName: file[1], url: file[2], isImage: false };
      return null;
    })
    .filter((a): a is CommentAttachment => a !== null);

  return { text, attachments };
}

export function buildCommentContent(
  text: string,
  attachments: CommentAttachment[],
): string {
  if (attachments.length === 0) return text;
  const links = attachments
    .map((a) =>
      a.isImage ? `![${a.fileName}](${a.url})` : `[${a.fileName}](${a.url})`,
    )
    .join("\n");
  const block = `${ATTACHMENT_SEPARATOR}\n${links}`;
  return text ? `${text}${SEPARATOR_PREFIX}${block}` : block;
}

export interface DetailPalette {
  panelBg: string;
  panelBorder: string;
  panelShadow: string;
  chevron: string;
  muted: string;
  title: string;
  sectionDivider: string;
  sectionLabel: string;
  threadLine: string;
  commentAuthor: string;
  commentTime: string;
  commentBorderExternal: string;
  commentBgExternal: string;
  emptyFg: string;
  emptySub: string;
  fieldLabel: string;
  fieldValue: string;
  fieldSep: string;
  historyTimeline: string;
  historyDotBorder: string;
  historyMsg: string;
  historySub: string;
  bodyText: string;
}

export const buildPalette = (_isDark: boolean): DetailPalette => ({
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
});

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

function normalizePriorityKey(value?: string) {
  if (!value) return "";
  return value.trim().toLowerCase().replace(/[\s-]/g, "_");
}

function mapPriorityLabel(
  value: string | undefined | null,
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
        from: statusLabel(t, entry.oldValue),
        to: statusLabel(t, entry.newValue),
      }),
    };
  }
  if (field.includes("assign")) {
    const raw = entry.newValue ?? "";
    const uuidLike =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    let nameLabel = raw || t("tickets.detail.unassigned");
    if (raw && uuidLike.test(raw)) {
      if (ticket?.assignedToId === raw && ticket.assignedToName) {
        nameLabel = ticket.assignedToName;
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
