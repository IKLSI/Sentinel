import type React from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";
import { ModalFormField } from "@/features/auth/components/ModalFormField";

interface Props {
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
  sx?: SxProps<Theme>;
}

export const ModalPasswordField: React.FC<Props> = ({
  showPassword,
  onToggleShow,
  showLabel,
  hideLabel,
  ...fieldProps
}) => (
  <ModalFormField
    {...fieldProps}
    type={showPassword ? "text" : "password"}
    trailing={
      <Box
        component="button"
        type="button"
        onClick={onToggleShow}
        tabIndex={-1}
        aria-label={showPassword ? hideLabel : showLabel}
        sx={{
          all: "unset",
          position: "absolute",
          right: "8px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "26px",
          height: "26px",
          borderRadius: "var(--r-sm)",
          cursor: "pointer",
          color: "var(--muted)",
          display: "grid",
          placeItems: "center",
          "&:hover": { background: "var(--s1)", color: "var(--text)" },
        }}
      >
        {showPassword ? (
          <VisibilityOffOutlined sx={{ fontSize: 16 }} />
        ) : (
          <VisibilityOutlined sx={{ fontSize: 16 }} />
        )}
      </Box>
    }
  />
);
