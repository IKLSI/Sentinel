import type React from "react";
import Box from "@mui/material/Box";
import { SearchInput } from "@/components/ui/forms/SearchInput";
import { FilterBuilder } from "@/components/ui/forms/FilterBuilder";
import type {
  FilterBuilderLabels,
  FilterCriterion,
  FilterFieldDefinition,
} from "@/components/ui/forms/FilterBuilder/types";
import { useT } from "@/contexts/I18nContext";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  criterion: FilterCriterion | null;
  onCriterionChange: (criterion: FilterCriterion | null) => void;
  fields: FilterFieldDefinition[];
  labels: FilterBuilderLabels;
  action?: React.ReactNode;
}

export const GridToolbar: React.FC<Props> = ({
  search,
  onSearchChange,
  criterion,
  onCriterionChange,
  fields,
  labels,
  action,
}) => {
  const t = useT();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "8px",
        mb: "16px",
        flexShrink: 0,
        position: "relative",
        zIndex: 2,
      }}
    >
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder={t("tech_health.search_placeholder")}
      />

      <FilterBuilder
        fields={fields}
        value={criterion}
        onChange={onCriterionChange}
        labels={labels}
      />

      {action && (
        <Box
          sx={{
            ml: "auto",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {action}
        </Box>
      )}
    </Box>
  );
};
