import type { SelectFieldOption } from "@/components/ui/forms/SelectField";
import { TICKET_STATUSES, statusLabelKeys } from "@/features/tickets/constants";
import { TicketPriority, TicketType } from "@/enums";

export interface TicketFiltersState {
  priority: string;
  status: string;
  type: string;
}

interface TicketFilterGroup {
  key: keyof TicketFiltersState;
  label: string;
  tone: string;
  options: SelectFieldOption[];
}

type Translate = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

const TICKET_PRIORITIES = Object.values(TicketPriority);
const TICKET_TYPES = Object.values(TicketType);

export const buildTicketFilterGroups = (t: Translate): TicketFilterGroup[] => [
  {
    key: "priority",
    label: t("tickets.list.filter_priority"),
    tone: "var(--sky)",
    options: [
      { value: "", label: t("tickets.list.filter_all_feminine") },
      ...TICKET_PRIORITIES.map((priority) => ({
        value: priority,
        label: t(`tickets.list.priority_${priority}`),
      })),
    ],
  },
  {
    key: "status",
    label: t("tickets.list.filter_status"),
    tone: "var(--cyan)",
    options: [
      { value: "", label: t("tickets.list.filter_all_masculine") },
      ...TICKET_STATUSES.map((status) => ({
        value: status,
        label: t(statusLabelKeys[status]),
      })),
    ],
  },
  {
    key: "type",
    label: t("tickets.list.filter_type"),
    tone: "var(--purple)",
    options: [
      { value: "", label: t("tickets.list.filter_all_masculine") },
      ...TICKET_TYPES.map((type) => ({
        value: type,
        label: t(`tickets.list.type_${type}`),
      })),
    ],
  },
];
