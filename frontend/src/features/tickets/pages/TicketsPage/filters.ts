import type { SelectFieldOption } from "@/components/ui/forms/SelectField";
import {
  TICKET_STATUSES,
  statusColor,
  statusLabelKeys,
} from "@/features/tickets/constants";
import {
  priorityColorOf,
  typeBadgeStyleOf,
} from "@/features/tickets/pages/TicketsPage/helpers";
import { TicketPriority, TicketType } from "@/enums";

export interface TicketFiltersState {
  priority: string;
  status: string;
  type: string;
}

export interface TicketFilterGroup {
  key: keyof TicketFiltersState;
  label: string;
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
    options: [
      { value: "", label: t("tickets.list.filter_all_feminine") },
      ...TICKET_PRIORITIES.map((priority) => ({
        value: priority,
        label: t(`tickets.list.priority_${priority}`),
        color: priorityColorOf(priority),
      })),
    ],
  },
  {
    key: "status",
    label: t("tickets.list.filter_status"),
    options: [
      { value: "", label: t("tickets.list.filter_all_masculine") },
      ...TICKET_STATUSES.map((status) => ({
        value: status,
        label: t(statusLabelKeys[status]),
        color: statusColor(status),
      })),
    ],
  },
  {
    key: "type",
    label: t("tickets.list.filter_type"),
    options: [
      { value: "", label: t("tickets.list.filter_all_masculine") },
      ...TICKET_TYPES.map((type) => ({
        value: type,
        label: t(`tickets.list.type_${type}`),
        color: typeBadgeStyleOf(type).color,
      })),
    ],
  },
];
