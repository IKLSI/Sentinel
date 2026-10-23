import type { FilterBuilderLabels } from "@/components/ui/forms/FilterBuilder/types";
import type { Translate } from "@/contexts/I18nContext";

export const buildFilterLabels = (
  t: Translate,
  keyPrefix: string,
): FilterBuilderLabels => ({
  empty: t(`${keyPrefix}empty`),
  fieldPlaceholder: t(`${keyPrefix}field_placeholder`),
  title: t(`${keyPrefix}add`),
  noField: t(`${keyPrefix}no_field`),
  noValue: t(`${keyPrefix}no_value`),
  valuePlaceholder: t(`${keyPrefix}value_placeholder`),
  edit: (label: string) => t(`${keyPrefix}edit`, { label }),
  remove: (label: string) => t(`${keyPrefix}remove`, { label }),
});
