import type {
  FilterBuilderLabels,
  FilterFieldDefinition,
} from "@/components/ui/forms/FilterBuilder/types";
import { UserAccessStatus, UserRole } from "@/enums";
import { USER_FILTER_FIELDS } from "@/features/users/pages/UsersPage/filterParams";

type Translate = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

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

export const buildUserFilterLabels = (t: Translate): FilterBuilderLabels => ({
  empty: t("settings.members.filter_empty"),
  fieldPlaceholder: t("settings.members.filter_field_placeholder"),
  title: t("settings.members.filter_add"),
  noField: t("settings.members.filter_no_field"),
  noValue: t("settings.members.filter_no_value"),
  valuePlaceholder: t("settings.members.filter_value_placeholder"),
  edit: (label: string) => t("settings.members.filter_edit", { label }),
  remove: (label: string) => t("settings.members.filter_remove", { label }),
});
