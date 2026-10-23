import type React from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import ButtonBase from "@mui/material/ButtonBase";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import KeyboardArrowDownOutlined from "@mui/icons-material/KeyboardArrowDownOutlined";
import type {
  FilterBuilderLabels,
  FilterCriterion,
  FilterFieldDefinition,
} from "@/components/ui/forms/FilterBuilder/types";

interface Props {
  field: FilterFieldDefinition | null;
  criterion: FilterCriterion | null;
  labels: FilterBuilderLabels;
  onEditField: () => void;
  onEditValues: () => void;
  onClear: () => void;
}

const INLINE_VALUES_MAX = 2;

const segmentSx = {
  font: "inherit",
  textAlign: "inherit",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  alignSelf: "stretch",
  px: "10px",
  cursor: "pointer",
  fontSize: "12.5px",
  lineHeight: "16px",
  letterSpacing: "-0.01em",
  transition: "background 0.12s",
  "&:hover": { background: "var(--s3)" },
  "&:focus-visible": { background: "var(--s3)" },
};

const shellSx = {
  display: "inline-flex",
  alignItems: "center",
  maxWidth: "100%",
  height: "32px",
  flexShrink: 0,
  borderRadius: "var(--r)",
  overflow: "hidden",
  background: "var(--s1)",
  border: "1px solid var(--border)",
  transition: "border-color 0.12s",
  "&:hover": { borderColor: "var(--border2)" },
};

const summaryOf = (
  field: FilterFieldDefinition,
  criterion: FilterCriterion,
) => {
  const selectedLabels = criterion.values.map(
    (value) =>
      field.options.find((option) => option.value === value)?.label ?? value,
  );
  const overflow = selectedLabels.length - INLINE_VALUES_MAX;

  return overflow > 0
    ? `${selectedLabels.slice(0, INLINE_VALUES_MAX).join(", ")} +${overflow}`
    : selectedLabels.join(", ");
};

export const FilterControl: React.FC<Props> = ({
  field,
  criterion,
  labels,
  onEditField,
  onEditValues,
  onClear,
}) => {
  if (!field || !criterion?.values.length) {
    return (
      <Box sx={shellSx}>
        <ButtonBase
          type="button"
          onClick={onEditField}
          sx={{ ...segmentSx, color: "var(--muted2)", fontWeight: 500 }}
        >
          {labels.empty}
          <KeyboardArrowDownOutlined sx={{ fontSize: 14, opacity: 0.8 }} />
        </ButtonBase>
      </Box>
    );
  }

  return (
    <Box sx={shellSx}>
      <ButtonBase
        type="button"
        aria-label={labels.edit(field.label)}
        onClick={onEditField}
        sx={{
          ...segmentSx,
          pr: 0,
          flexShrink: 0,
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--muted)",
        }}
      >
        <Box component="span" sx={{ transform: "translateY(1px)" }}>
          {`${field.label} :`}
        </Box>
      </ButtonBase>

      <ButtonBase
        type="button"
        aria-label={labels.edit(field.label)}
        onClick={onEditValues}
        sx={{
          ...segmentSx,
          pl: "11px",
          gap: "5px",
          minWidth: 0,
          color: "var(--text)",
          fontWeight: 600,
        }}
      >
        <Box
          component="span"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {summaryOf(field, criterion)}
        </Box>
        <KeyboardArrowDownOutlined
          sx={{ fontSize: 14, flexShrink: 0, opacity: 0.7 }}
        />
      </ButtonBase>

      <IconButton
        type="button"
        aria-label={labels.remove(field.label)}
        onClick={onClear}
        sx={{
          ...segmentSx,
          p: 0,
          borderRadius: 0,
          width: "26px",
          flexShrink: 0,
          justifyContent: "center",
          color: "var(--muted2)",
          "&:hover": { background: "var(--s3)", color: "var(--text)" },
        }}
      >
        <CloseOutlined sx={{ fontSize: 13 }} />
      </IconButton>
    </Box>
  );
};
