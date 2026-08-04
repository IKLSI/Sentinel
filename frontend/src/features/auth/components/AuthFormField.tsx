import type React from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { resolveFieldError } from "@/helpers/validation/resolveFieldError";

interface AuthFormFieldProps {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  t: (key: string) => string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  invalid?: boolean;
  sx?: SxProps<Theme>;
  bare?: boolean;
}

export const AuthFormField: React.FC<AuthFormFieldProps> = ({
  id,
  label,
  registration,
  error,
  t,
  type = "text",
  placeholder,
  autoComplete,
  required,
  invalid,
  sx,
  bare,
}) => {
  const content = (
    <>
      <Box component="label" className="lp-label" htmlFor={id}>
        {label}
        {required && (
          <>
            {" "}
            <span style={{ color: "var(--auth-red-500)" }}>*</span>
          </>
        )}
      </Box>
      <input
        id={id}
        type={type}
        className={`lp-input${(invalid ?? !!error) ? " lp-input--error" : ""}`}
        placeholder={placeholder}
        autoComplete={autoComplete}
        {...registration}
      />
      {error && (
        <Box className="lp-field-error">{resolveFieldError(error, t)}</Box>
      )}
    </>
  );

  if (bare) return content;

  return (
    <Box className="lp-field" sx={sx}>
      {content}
    </Box>
  );
};
