import type React from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import OutlinedInput from "@mui/material/OutlinedInput";
import type { InputBaseComponentProps } from "@mui/material/InputBase";
import type { SxProps, Theme } from "@mui/material/styles";
import { FormField } from "@/components/ui/forms/FormField";
import { resolveFieldError } from "@/helpers/validation/resolveFieldError";

const translateKey = (key: string) => key;

interface FormTextFieldProps {
  id: string;
  label?: string;
  registration?: UseFormRegisterReturn;
  value?: string;
  onValueChange?: (value: string) => void;
  error?: FieldError;
  t?: (key: string) => string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  required?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  multiline?: boolean;
  rows?: number;
  endAdornment?: React.ReactNode;
  inputProps?: InputBaseComponentProps;
  sx?: SxProps<Theme>;
}

export const FormTextField: React.FC<FormTextFieldProps> = ({
  id,
  label,
  registration,
  value,
  onValueChange,
  error,
  t = translateKey,
  type = "text",
  placeholder,
  autoComplete,
  autoFocus,
  required,
  readOnly,
  invalid,
  multiline,
  rows,
  endAdornment,
  inputProps,
  sx,
}) => {
  const { ref, ...field } = registration ?? {};
  const controlled = onValueChange
    ? {
        value,
        onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
          onValueChange(event.target.value),
      }
    : { value };

  return (
    <FormField
      id={id}
      label={label}
      required={required}
      invalid={invalid ?? !!error}
      helperText={resolveFieldError(error, t)}
      sx={sx}
    >
      <OutlinedInput
        {...field}
        {...controlled}
        id={id}
        inputRef={ref}
        type={type}
        size="small"
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        readOnly={readOnly}
        multiline={multiline}
        rows={rows}
        endAdornment={endAdornment}
        inputProps={inputProps}
      />
    </FormField>
  );
};
