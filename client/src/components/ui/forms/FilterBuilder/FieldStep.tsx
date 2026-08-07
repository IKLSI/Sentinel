import type React from "react";
import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import { OptionList } from "@/components/ui/forms/FilterBuilder/OptionList";
import { OptionRow } from "@/components/ui/forms/FilterBuilder/OptionRow";
import { PopoverSearch } from "@/components/ui/forms/FilterBuilder/PopoverSearch";
import type {
  FilterBuilderLabels,
  FilterFieldDefinition,
} from "@/components/ui/forms/FilterBuilder/types";

interface Props {
  fields: FilterFieldDefinition[];
  selectedField: string | undefined;
  labels: FilterBuilderLabels;
  onSelect: (fieldKey: string) => void;
}

export const FieldStep: React.FC<Props> = ({
  fields,
  selectedField,
  labels,
  onSelect,
}) => {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const matches = useMemo(
    () =>
      fields.filter((field) =>
        field.label.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [fields, query],
  );

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!matches.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % matches.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + matches.length) % matches.length);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      onSelect(matches[Math.min(activeIndex, matches.length - 1)].key);
    }
  };

  return (
    <>
      <PopoverSearch
        divider
        placeholder={labels.fieldPlaceholder}
        value={query}
        onChange={(value) => {
          setQuery(value);
          setActiveIndex(0);
        }}
        onKeyDown={handleKeyDown}
      />

      <OptionList emptyLabel={labels.noField} isEmpty={matches.length === 0}>
        {matches.map((field, index) => (
          <OptionRow
            key={field.key}
            label={field.label}
            active={index === activeIndex}
            selected={field.key === selectedField}
            trailing={
              field.key === selectedField ? (
                <CheckOutlined sx={{ fontSize: 13, color: "var(--accent)" }} />
              ) : (
                <Box
                  component="span"
                  sx={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "var(--muted)",
                  }}
                >
                  {field.options.length}
                </Box>
              )
            }
            onClick={() => onSelect(field.key)}
            onMouseEnter={() => setActiveIndex(index)}
          />
        ))}
      </OptionList>
    </>
  );
};
