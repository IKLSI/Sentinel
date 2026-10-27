import type React from "react";
import Autocomplete, {
  type AutocompleteRenderInputParams,
} from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";

interface Props {
  id: string;
  label: string;
  icon: React.ReactNode;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  loading: boolean;
  maxLength: number;
  placeholder: string;
  hint?: React.ReactNode;
  noOptionsText?: string;
  optionLabel?: (option: string) => string;
}

const fieldLabelSx = {
  display: "block",
  mb: "6px",
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--text)",
} as const;

const fieldHintSx = {
  mt: "6px",
  fontSize: "11px",
  color: "var(--muted)",
  lineHeight: 1.5,
} as const;

const optionSx = {
  fontFamily: "var(--font-mono)",
  fontSize: "12px",
} as const;

const identity = (option: string) => option;

const scopeInputSlotProps = (
  params: AutocompleteRenderInputParams,
  icon: React.ReactNode,
  loading: boolean,
  maxLength: number,
) => ({
  ...params.slotProps,
  input: {
    ...params.slotProps.input,
    startAdornment: <InputAdornment position="start">{icon}</InputAdornment>,
    endAdornment: (
      <>
        {loading && <CircularProgress color="inherit" size={14} />}
        {params.slotProps.input.endAdornment}
      </>
    ),
  },
  htmlInput: {
    ...params.slotProps.htmlInput,
    maxLength,
    style: { fontFamily: "var(--font-mono)", fontSize: "12px" },
  },
});

export const ScopeAutocomplete: React.FC<Props> = ({
  id,
  label,
  icon,
  options,
  value,
  onChange,
  disabled,
  loading,
  maxLength,
  placeholder,
  hint,
  noOptionsText,
  optionLabel = identity,
}) => (
  <Box>
    <Box component="label" htmlFor={id} sx={fieldLabelSx}>
      {label}
    </Box>
    <Autocomplete
      id={id}
      freeSolo
      fullWidth
      size="small"
      options={options}
      inputValue={value}
      onInputChange={(_, nextValue) => onChange(nextValue)}
      disabled={disabled}
      loading={loading}
      noOptionsText={noOptionsText}
      renderOption={({ key, ...props }, option) => (
        <Box component="li" key={key} {...props} sx={optionSx}>
          {optionLabel(option)}
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          slotProps={scopeInputSlotProps(params, icon, loading, maxLength)}
        />
      )}
    />
    {hint && <Box sx={fieldHintSx}>{hint}</Box>}
  </Box>
);
