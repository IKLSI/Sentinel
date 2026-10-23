import type React from "react";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";
import { FormTextField } from "@/components/ui/forms/FormTextField";

type PasswordTextFieldProps = Omit<
  React.ComponentProps<typeof FormTextField>,
  "type" | "endAdornment"
> & {
  showPassword: boolean;
  onToggleShow: () => void;
  showLabel: string;
  hideLabel: string;
};

export const PasswordTextField: React.FC<PasswordTextFieldProps> = ({
  showPassword,
  onToggleShow,
  showLabel,
  hideLabel,
  ...fieldProps
}) => (
  <FormTextField
    {...fieldProps}
    type={showPassword ? "text" : "password"}
    endAdornment={
      <InputAdornment position="end">
        <IconButton
          size="small"
          edge="end"
          tabIndex={-1}
          onClick={onToggleShow}
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
