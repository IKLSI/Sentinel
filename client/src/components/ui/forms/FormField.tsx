import type React from "react";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import type { SxProps, Theme } from "@mui/material/styles";

const LABEL_SX = {
  mb: "5px",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.02em",
  color: "var(--muted2)",
  "&.Mui-focused, &.Mui-error": { color: "var(--muted2)" },
  "& .MuiFormLabel-asterisk": { color: "var(--red)" },
} as const;

interface FormFieldProps {
  id: string;
  label?: string;
  required?: boolean;
  invalid?: boolean;
  helperText?: string;
  sx?: SxProps<Theme>;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  required,
  invalid,
  helperText,
  sx,
  children,
}) => (
  <FormControl fullWidth required={required} error={invalid} sx={sx}>
    {label && (
      <FormLabel htmlFor={id} sx={LABEL_SX}>
        {label}
      </FormLabel>
    )}
    {children}
    {helperText && <FormHelperText>{helperText}</FormHelperText>}
  </FormControl>
);
