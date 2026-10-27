import { RUNTIME_STATUS } from "@/features/projects/pages/ProjectDetailPage/constants";
import {
  getRuntimeDaysRemaining,
  getRuntimeUrgency,
} from "@/features/projects/pages/ProjectDetailPage/helpers";
import type { Translate } from "@/contexts/I18nContext";
import type { Runtime } from "@/domains/projects/types";
import type { VirtualTableColumn } from "@/components/ui/common/table/VirtualTable";

const COLUMN_KEYS = {
  runtime: "runtime",
  version: "version",
  status: "status",
  deadline: "deadline",
  eolDate: "eolDate",
  ticket: "ticket",
} as const;

export const DEFAULT_SORT = {
  key: COLUMN_KEYS.deadline,
  direction: "asc",
} as const;

const NEVER_ASSESSED_RANK = Number.MAX_SAFE_INTEGER;

const daysRank = (runtime: Runtime) =>
  getRuntimeDaysRemaining(runtime) ?? NEVER_ASSESSED_RANK;

export const comparators = {
  [COLUMN_KEYS.runtime]: (a: Runtime, b: Runtime) =>
    a.name.localeCompare(b.name),
  [COLUMN_KEYS.status]: (a: Runtime, b: Runtime) =>
    RUNTIME_STATUS[getRuntimeUrgency(a)].weight -
    RUNTIME_STATUS[getRuntimeUrgency(b)].weight,
  [COLUMN_KEYS.deadline]: (a: Runtime, b: Runtime) => daysRank(a) - daysRank(b),
};

export const searchableValues = (runtime: Runtime) => [
  runtime.name,
  runtime.version,
  ...runtime.versions,
];

export const buildRuntimeColumns = (t: Translate): VirtualTableColumn[] => [
  {
    key: COLUMN_KEYS.runtime,
    label: t("tech_health.table.runtime.runtime"),
    width: "22%",
    sortable: true,
  },
  {
    key: COLUMN_KEYS.version,
    label: t("tech_health.table.runtime.version"),
    width: "20%",
  },
  {
    key: COLUMN_KEYS.status,
    label: t("tech_health.table.dep.status"),
    width: "14%",
    sortable: true,
  },
  {
    key: COLUMN_KEYS.deadline,
    label: t("tech_health.table.runtime.deadline"),
    width: "20%",
    sortable: true,
  },
  {
    key: COLUMN_KEYS.eolDate,
    label: t("tech_health.table.runtime.eol"),
    width: "14%",
    align: "right",
  },
  {
    key: COLUMN_KEYS.ticket,
    label: t("tech_health.table.ticket"),
    width: "10%",
    align: "center",
  },
];
