import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import { FieldStep } from "@/components/ui/forms/FilterBuilder/FieldStep";
import { FilterControl } from "@/components/ui/forms/FilterBuilder/FilterControl";
import { ValueStep } from "@/components/ui/forms/FilterBuilder/ValueStep";
import type {
  FilterBuilderLabels,
  FilterCriterion,
  FilterFieldDefinition,
} from "@/components/ui/forms/FilterBuilder/types";

interface Props {
  fields: FilterFieldDefinition[];
  value: FilterCriterion | null;
  onChange: (criterion: FilterCriterion | null) => void;
  labels: FilterBuilderLabels;
}

type PopoverState =
  | { step: "closed" }
  | { step: "field" }
  | { step: "value"; field: string };

const CLOSED: PopoverState = { step: "closed" };

const popoverSx = {
  position: "absolute" as const,
  top: "calc(100% + 6px)",
  left: 0,
  zIndex: 30,
  width: "236px",
  background: "var(--s2)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-md)",
  boxShadow: "var(--sh-3)",
  overflow: "hidden",
  animation: "fadeInUp 0.12s ease forwards",
};

export const FilterBuilder: React.FC<Props> = ({
  fields,
  value,
  onChange,
  labels,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [popover, setPopover] = useState<PopoverState>(CLOSED);

  const close = useCallback(() => setPopover(CLOSED), []);

  useEffect(() => {
    if (popover.step === "closed") return;

    const handleClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node))
        close();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [popover.step, close]);

  const fieldOf = (key: string | undefined) =>
    fields.find((field) => field.key === key) ?? null;

  const openField = () =>
    setPopover((current) =>
      current.step === "field" ? CLOSED : { step: "field" },
    );

  const openValues = () => {
    if (!value) return;
    setPopover((current) =>
      current.step === "value" ? CLOSED : { step: "value", field: value.field },
    );
  };

  const toggleValue = (fieldKey: string, option: string) => {
    const current = value?.field === fieldKey ? value.values : [];
    const next = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];

    onChange(next.length ? { field: fieldKey, values: next } : null);
  };

  const renderPopover = () => {
    if (popover.step === "closed") return null;

    if (popover.step === "field") {
      return (
        <Box sx={popoverSx}>
          <FieldStep
            fields={fields}
            selectedField={value?.field}
            labels={labels}
            onSelect={(fieldKey) =>
              setPopover({ step: "value", field: fieldKey })
            }
          />
        </Box>
      );
    }

    const field = fieldOf(popover.field);
    if (!field) return null;

    return (
      <Box sx={popoverSx}>
        <ValueStep
          field={field}
          values={value?.field === field.key ? value.values : []}
          labels={labels}
          onToggle={(option) => toggleValue(field.key, option)}
        />
      </Box>
    );
  };

  return (
    <Box
      ref={rootRef}
      role="group"
      aria-label={labels.title}
      sx={{ position: "relative", display: "inline-flex", flexShrink: 0 }}
    >
      <FilterControl
        field={fieldOf(value?.field)}
        criterion={value}
        labels={labels}
        onEditField={openField}
        onEditValues={openValues}
        onClear={() => {
          close();
          onChange(null);
        }}
      />
      {renderPopover()}
    </Box>
  );
};
