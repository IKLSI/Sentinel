import type React from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { resolveFieldError } from "@/helpers/validation/resolveFieldError";

const modalFieldInputSx = {
  width: "100%",
  display: "block",
  boxSizing: "border-box",
  background: "var(--s2)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-sm)",
  px: "12px",
  py: "9px",
  fontSize: "13px",
  color: "var(--text)",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
  "&:focus": {
    borderColor: "var(--accent-border)",
    boxShadow: "0 0 0 3px var(--accent-subtle)",
  },
  "&::placeholder": { color: "var(--muted2)" },
} as const;

const ModalFieldLabel: React.FC<{
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ htmlFor, required, children }) => (
  <Box
    component="label"
    htmlFor={htmlFor}
    sx={{
      display: "block",
      fontSize: "11px",
      fontWeight: 600,
      color: "var(--muted2)",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      mb: "7px",
    }}
  >
    {children}
    {required && (
      <>
        {" "}
        <Box component="span" sx={{ color: "var(--red)" }}>
          *
        </Box>
      </>
    )}
  </Box>
);

const ModalFieldError: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Box sx={{ mt: "6px", fontSize: "11.5px", color: "var(--red)" }}>
    {children}
  </Box>
);

interface Props {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  t: (key: string) => string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  trailing?: React.ReactNode;
  sx?: SxProps<Theme>;
}

export const ModalFormField: React.FC<Props> = ({
  id,
  label,
  registration,
  error,
  t,
  type = "text",
  placeholder,
  autoComplete,
  required,
  trailing,
  sx,
}) => (
  <Box sx={sx}>
    <ModalFieldLabel htmlFor={id} required={required}>
      {label}
    </ModalFieldLabel>
    <Box sx={{ position: "relative" }}>
      <Box
        component="input"
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        sx={{
          ...modalFieldInputSx,
          ...(trailing ? { pr: "42px" } : {}),
          ...(error ? { borderColor: "var(--red)" } : {}),
        }}
        {...registration}
      />
      {trailing}
    </Box>
    {error && <ModalFieldError>{resolveFieldError(error, t)}</ModalFieldError>}
  </Box>
);
