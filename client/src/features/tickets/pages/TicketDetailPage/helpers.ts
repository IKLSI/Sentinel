import { z } from "zod";
import type { Ticket, TicketHistory } from "@/domains/tickets/types";
import type { CommentAttachment } from "@/components/ui/common/AttachmentChip";
import { statusLabel } from "@/features/tickets/constants";
import type { Translate } from "@/contexts/I18nContext";
import {
  HISTORY_TONES,
  PRIORITY_CONFIG,
} from "@/features/tickets/pages/TicketDetailPage/constants";

export const commentContentSchema = z.string().trim().min(1);

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

export function getRelativeShort(date: string, t: Translate, culture: string) {
  const diff = Math.max(0, Date.now() - new Date(date).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return t("tickets.detail.relative_now");
  if (min < 60) return t("tickets.detail.relative_minutes", { n: min });
  const hours = Math.floor(min / 60);
  if (hours < 24) return t("tickets.detail.relative_hours", { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t("tickets.detail.relative_days", { n: days });
  return new Date(date).toLocaleDateString(culture, {
    day: "2-digit",
    month: "short",
  });
}

function normalizePriorityKey(value?: string) {
  if (!value) return "";
  return value.trim().toLowerCase().replace(/[\s-]/g, "_");
}

function mapPriorityLabel(value: string | undefined | null, t: Translate) {
  if (!value) return "—";
  const key = normalizePriorityKey(value);
  const labelKey = PRIORITY_CONFIG[key]?.labelKey;
  return labelKey ? t(labelKey) : value;
}

const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function assigneeLabel(raw: string, t: Translate, ticket?: Ticket) {
  if (!raw) return t("tickets.detail.unassigned");
  if (!UUID_PATTERN.test(raw)) return raw;
  if (ticket?.assignedToId === raw && ticket.assignedToName)
    return ticket.assignedToName;
  return `${raw.slice(0, 8)}…`;
}

export function historyPresentation(
  entry: TicketHistory,
  t: Translate,
  ticket?: Ticket,
) {
  const field = entry.field.toLowerCase();
  if (field === "created" || field === "creation" || field.includes("create")) {
    return {
      tone: HISTORY_TONES.created,
      message: t("tickets.detail.history_created"),
    };
  }
  if (field.includes("status")) {
    return {
      tone: HISTORY_TONES.status,
      message: t("tickets.detail.history_status_change", {
        from: statusLabel(t, entry.oldValue),
        to: statusLabel(t, entry.newValue),
      }),
    };
  }
  if (field.includes("assign")) {
    return {
      tone: HISTORY_TONES.assign,
      message: t("tickets.detail.history_assigned", {
        name: assigneeLabel(entry.newValue ?? "", t, ticket),
      }),
    };
  }
  if (field.includes("priority")) {
    return {
      tone: HISTORY_TONES.priority,
      message: t("tickets.detail.history_priority_change", {
        from: mapPriorityLabel(entry.oldValue, t),
        to: mapPriorityLabel(entry.newValue, t),
      }),
    };
  }
  return {
    tone: HISTORY_TONES.default,
    message:
      entry.oldValue || entry.newValue
        ? `${entry.field} ${entry.oldValue ?? "—"} → ${entry.newValue ?? "—"}`
        : t("tickets.detail.history_field_updated", { field: entry.field }),
  };
}
