import type {
  FilterBuilderLabels,
  FilterFieldDefinition,
} from "@/components/ui/forms/FilterBuilder/types";
import type { Project } from "@/domains/projects/types";
import type { User } from "@/domains/users/types";
import { TicketPriority, TicketType } from "@/enums";
import { TICKET_STATUSES, statusLabelKeys } from "@/features/tickets/constants";
import {
  TICKET_FILTER_FIELDS,
  UNSET_FILTER_VALUE,
} from "@/features/tickets/pages/TicketsPage/filterParams";

type Translate = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

export const buildTicketFilterFields = (
  t: Translate,
  users: User[],
  projects: Project[],
): FilterFieldDefinition[] => [
  {
    key: TICKET_FILTER_FIELDS.priority,
    label: t("tickets.list.filter_priority"),
    options: Object.values(TicketPriority).map((priority) => ({
      value: priority,
      label: t(`tickets.list.priority_${priority}`),
    })),
  },
  {
    key: TICKET_FILTER_FIELDS.status,
    label: t("tickets.list.filter_status"),
    options: TICKET_STATUSES.map((status) => ({
      value: status,
      label: t(statusLabelKeys[status]),
    })),
  },
  {
    key: TICKET_FILTER_FIELDS.type,
    label: t("tickets.list.filter_type"),
    options: Object.values(TicketType).map((type) => ({
      value: type,
      label: t(`tickets.list.type_${type}`),
    })),
  },
  {
    key: TICKET_FILTER_FIELDS.assignedTo,
    label: t("tickets.list.filter_assignee"),
    options: [
      { value: UNSET_FILTER_VALUE, label: t("tickets.list.unassigned") },
      ...users.map((user) => ({
        value: user.id,
        label: `${user.firstName} ${user.lastName}`,
      })),
    ],
  },
  {
    key: TICKET_FILTER_FIELDS.project,
    label: t("tickets.list.filter_project"),
    options: [
      { value: UNSET_FILTER_VALUE, label: t("tickets.list.no_project") },
      ...projects.map((project) => ({
        value: project.id,
        label: project.name,
      })),
    ],
  },
];

export const buildTicketFilterLabels = (t: Translate): FilterBuilderLabels => ({
  empty: t("tickets.list.filter_empty"),
  fieldPlaceholder: t("tickets.list.filter_field_placeholder"),
  title: t("tickets.list.filter_add"),
  noField: t("tickets.list.filter_no_field"),
  noValue: t("tickets.list.filter_no_value"),
  valuePlaceholder: t("tickets.list.filter_value_placeholder"),
  edit: (label: string) => t("tickets.list.filter_edit", { label }),
  remove: (label: string) => t("tickets.list.filter_remove", { label }),
});
