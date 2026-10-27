import { createFilterSearchParams } from "@/components/ui/forms/FilterBuilder/searchParams";
import type {
  FilterBuilderLabels,
  FilterFieldDefinition,
} from "@/components/ui/forms/FilterBuilder/types";
import { buildFilterLabels } from "@/components/ui/forms/FilterBuilder/labels";
import type { Translate } from "@/contexts/I18nContext";
import type { UserCriteriaFilters } from "@/domains/users/types";
import { UserAccessStatus, UserRole } from "@/enums";

const USER_FILTER_FIELDS = {
  role: "role",
  status: "status",
} as const;

type UserFilterField =
  (typeof USER_FILTER_FIELDS)[keyof typeof USER_FILTER_FIELDS];

export type UserFiltersSearch = Partial<Record<UserFilterField, string>>;

export const {
  criterionFromSearch,
  searchFromCriterion,
  sanitizeSearch: sanitizeUserFiltersSearch,
  queryFromCriterion,
} = createFilterSearchParams<UserFilterField, UserCriteriaFilters>(
  USER_FILTER_FIELDS,
);

export const buildUserFilterFields = (
  t: Translate,
): FilterFieldDefinition[] => [
  {
    key: USER_FILTER_FIELDS.role,
    label: t("settings.members.col_role"),
    options: [
      { value: UserRole.Admin, label: t("settings.role.admin") },
      { value: UserRole.Developer, label: t("settings.role.developer") },
    ],
  },
  {
    key: USER_FILTER_FIELDS.status,
    label: t("settings.members.col_status"),
    options: [
      {
        value: UserAccessStatus.Active,
        label: t("settings.members.status_active"),
      },
      {
        value: UserAccessStatus.Suspended,
        label: t("settings.members.status_suspended"),
      },
    ],
  },
];

export const buildUserFilterLabels = (t: Translate): FilterBuilderLabels =>
  buildFilterLabels(t, "settings.members.filter_");
