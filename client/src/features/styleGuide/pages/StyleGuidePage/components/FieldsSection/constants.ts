import type { FieldError } from "react-hook-form";
import type {
  FilterCriterion,
  FilterFieldDefinition,
} from "@/components/ui/forms/FilterBuilder/types";
import type { Translate } from "@/contexts/I18nContext";
import { TicketPriority } from "@/enums";
import { statusLabelKeys } from "@/features/tickets/constants";
import {
  priorityLabelKeys,
  typeTooltipKeys,
} from "@/features/tickets/pages/TicketsPage/helpers";

export const FIELD_GRID_SX = {
  display: "grid",
  gridTemplateColumns: {
    xs: "minmax(0, 1fr)",
    sm: "repeat(2, minmax(0, 1fr))",
  },
  gap: "20px 24px",
} as const;

export const INVALID_URL_ERROR: FieldError = {
  type: "manual",
  message: "validation.project.repository_url_invalid",
};

export const SAMPLE_INVALID_URL = "gitlab.interne";

export const SAMPLE_BRANCH = "main";

export const INITIAL_FILTER: FilterCriterion = {
  field: "priority",
  values: [TicketPriority.Critical, TicketPriority.High],
};

const optionsOf = (labelKeys: Record<string, string>, t: Translate) =>
  Object.entries(labelKeys).map(([value, key]) => ({ value, label: t(key) }));

export const priorityOptionsOf = (t: Translate) =>
  optionsOf(priorityLabelKeys, t);

export const buildFilterFields = (t: Translate): FilterFieldDefinition[] => [
  {
    key: "priority",
    label: t("tickets.list.filter_priority"),
    options: priorityOptionsOf(t),
  },
  {
    key: "status",
    label: t("tickets.list.filter_status"),
    options: optionsOf(statusLabelKeys, t),
  },
  {
    key: "type",
    label: t("tickets.list.filter_type"),
    options: optionsOf(typeTooltipKeys, t),
  },
];
