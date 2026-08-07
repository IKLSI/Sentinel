import type React from "react";
import { useMemo, useState } from "react";
import { OptionList } from "@/components/ui/forms/FilterBuilder/OptionList";
import { OptionRow } from "@/components/ui/forms/FilterBuilder/OptionRow";
import { PopoverSearch } from "@/components/ui/forms/FilterBuilder/PopoverSearch";
import type {
  FilterBuilderLabels,
  FilterFieldDefinition,
} from "@/components/ui/forms/FilterBuilder/types";

interface Props {
  field: FilterFieldDefinition;
  values: string[];
  labels: FilterBuilderLabels;
  onToggle: (value: string) => void;
}

export const ValueStep: React.FC<Props> = ({
  field,
  values,
  labels,
  onToggle,
}) => {
  const [query, setQuery] = useState("");

  const matches = useMemo(
    () =>
      field.options.filter((option) =>
        option.label.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [field.options, query],
  );

  return (
    <>
      <PopoverSearch
        divider
        placeholder={labels.valuePlaceholder}
        value={query}
        onChange={setQuery}
      />

      <OptionList
        multiSelectable
        emptyLabel={labels.noValue}
        isEmpty={matches.length === 0}
      >
        {matches.map((option) => (
          <OptionRow
            key={option.value}
            checkbox
            label={option.label}
            selected={values.includes(option.value)}
            onClick={() => onToggle(option.value)}
          />
        ))}
      </OptionList>
    </>
  );
};
