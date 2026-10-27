import type {
  FilterBuilderLabels,
  FilterFieldDefinition,
} from "@/components/ui/forms/FilterBuilder/types";
import type { ProjectOption } from "@/domains/projects/types";
import type { UserOption } from "@/domains/users/types";
import { TicketPriority, TicketType } from "@/enums";
import { TICKET_STATUSES, statusLabelKeys } from "@/features/tickets/constants";
import {
  TICKET_FILTER_FIELDS,
  UNSET_FILTER_VALUE,
} from "@/features/tickets/pages/TicketsPage/filterParams";
import { buildFilterLabels } from "@/components/ui/forms/FilterBuilder/labels";
import type { Translate } from "@/contexts/I18nContext";

export const buildTicketFilterFields = (
  t: Translate,
  users: UserOption[],
  projects: ProjectOption[],
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
        label: user.name,
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

export const buildTicketFilterLabels = (t: Translate): FilterBuilderLabels =>
  buildFilterLabels(t, "tickets.list.filter_");
