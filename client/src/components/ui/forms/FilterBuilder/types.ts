interface FilterOption {
  value: string;
  label: string;
}

export interface FilterFieldDefinition {
  key: string;
  label: string;
  options: FilterOption[];
}

export interface FilterCriterion {
  field: string;
  values: string[];
}

export interface FilterBuilderLabels {
  empty: string;
  fieldPlaceholder: string;
  noField: string;
  noValue: string;
  title: string;
  valuePlaceholder: string;
  edit: (label: string) => string;
  remove: (label: string) => string;
}
