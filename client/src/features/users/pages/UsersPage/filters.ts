import type {
  FilterBuilderLabels,
  FilterFieldDefinition,
} from "@/components/ui/forms/FilterBuilder/types";
import { UserAccessStatus, UserRole } from "@/enums";
import { USER_FILTER_FIELDS } from "@/features/users/pages/UsersPage/filterParams";
import { buildFilterLabels } from "@/components/ui/forms/FilterBuilder/labels";
import type { Translate } from "@/contexts/I18nContext";

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
