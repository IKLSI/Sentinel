import type React from "react";
import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";
import { FormTextField } from "@/components/ui/forms/FormTextField";

type PasswordTextFieldProps = Omit<
  React.ComponentProps<typeof FormTextField>,
  "type" | "endAdornment"
> & {
  showPassword?: boolean;
  onToggleShow?: () => void;
  showLabel: string;
  hideLabel: string;
};

export const PasswordTextField: React.FC<PasswordTextFieldProps> = ({
  showPassword: controlledShowPassword,
  onToggleShow,
  showLabel,
  hideLabel,
  ...fieldProps
}) => {
  const [internalShowPassword, setInternalShowPassword] = useState(false);
  const showPassword = controlledShowPassword ?? internalShowPassword;
  const toggleShow =
    onToggleShow ?? (() => setInternalShowPassword((value) => !value));

  return (
    <FormTextField
      {...fieldProps}
      type={showPassword ? "text" : "password"}
      endAdornment={
        <InputAdornment position="end">
          <IconButton
            size="small"
            edge="end"
            onClick={toggleShow}
            aria-label={showPassword ? hideLabel : showLabel}
            sx={{
              color: "var(--muted)",
              "&:hover": { background: "transparent", color: "var(--text)" },
            }}
          >
            {showPassword ? (
              <VisibilityOffOutlined fontSize="small" />
            ) : (
              <VisibilityOutlined fontSize="small" />
            )}
          </IconButton>
        </InputAdornment>
      }
    />
  );
};
