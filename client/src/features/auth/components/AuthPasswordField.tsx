import type React from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";
import { resolveFieldError } from "@/helpers/validation/resolveFieldError";

interface AuthPasswordFieldProps {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  t: (key: string) => string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  showPassword: boolean;
  onToggleShow: () => void;
  showLabel: string;
  hideLabel: string;
  toggleIconSize?: number;
  sx?: SxProps<Theme>;
  invalid?: boolean;
}

export const AuthPasswordField: React.FC<AuthPasswordFieldProps> = ({
  id,
  label,
  registration,
  error,
  t,
  placeholder,
  autoComplete,
  required,
  showPassword,
  onToggleShow,
  showLabel,
  hideLabel,
  toggleIconSize = 16,
  sx,
  invalid,
}) => (
  <Box className="lp-field" sx={sx}>
    <Box component="label" className="lp-label" htmlFor={id}>
      {label}
      {required && (
        <>
          {" "}
          <span style={{ color: "var(--auth-red-500)" }}>*</span>
        </>
      )}
    </Box>
    <Box className="lp-input-wrap">
      <Box
        component="input"
        id={id}
        type={showPassword ? "text" : "password"}
        className={`lp-input${(invalid ?? !!error) ? " lp-input--error" : ""}`}
        placeholder={placeholder}
        autoComplete={autoComplete}
        sx={{ paddingRight: "44px" }}
        {...registration}
      />
      <button
        type="button"
        className="lp-pw-toggle"
        onClick={onToggleShow}
        tabIndex={-1}
        aria-label={showPassword ? hideLabel : showLabel}
      >
        {showPassword ? (
          <VisibilityOffOutlined sx={{ fontSize: toggleIconSize }} />
        ) : (
          <VisibilityOutlined sx={{ fontSize: toggleIconSize }} />
        )}
      </button>
    </Box>
    {error && (
      <Box className="lp-field-error">{resolveFieldError(error, t)}</Box>
    )}
  </Box>
);
