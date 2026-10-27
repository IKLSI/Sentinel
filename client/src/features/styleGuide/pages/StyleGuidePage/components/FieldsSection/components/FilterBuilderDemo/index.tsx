import type React from "react";
import { useMemo, useState } from "react";
import { FilterBuilder } from "@/components/ui/forms/FilterBuilder";
import { buildFilterLabels } from "@/components/ui/forms/FilterBuilder/labels";
import type { FilterCriterion } from "@/components/ui/forms/FilterBuilder/types";
import { useT } from "@/contexts/I18nContext";
import {
  INITIAL_FILTER,
  buildFilterFields,
} from "@/features/styleGuide/pages/StyleGuidePage/components/FieldsSection/constants";

const TICKET_FILTER_PREFIX = "tickets.list.filter_";

export const FilterBuilderDemo: React.FC = () => {
  const t = useT();
  const [criterion, setCriterion] = useState<FilterCriterion | null>(
    INITIAL_FILTER,
  );
  const fields = useMemo(() => buildFilterFields(t), [t]);
  const labels = useMemo(() => buildFilterLabels(t, TICKET_FILTER_PREFIX), [t]);

  return (
    <FilterBuilder
      fields={fields}
      value={criterion}
      onChange={setCriterion}
      labels={labels}
    />
  );
};
