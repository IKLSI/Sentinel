import type React from "react";
import Button, { type ButtonProps } from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { useT } from "@/contexts/I18nContext";

interface ModalActionsProps {
  onCancel: () => void;
  cancelLabel?: string;
  cancelDisabled?: boolean;
  confirmLabel: string;
  pendingLabel?: string;
  pending: boolean;
  disabled?: boolean;
  formId?: string;
  onConfirm?: () => void;
  color?: ButtonProps["color"];
}

export const ModalActions: React.FC<ModalActionsProps> = ({
  onCancel,
  cancelLabel,
  cancelDisabled,
  confirmLabel,
  pendingLabel,
  pending,
  disabled = false,
  formId,
  onConfirm,
  color,
}) => {
  const t = useT();
  const pendingContent = pendingLabel ?? (
    <CircularProgress size={14} sx={{ color: "var(--s1)" }} />
  );

  return (
    <>
      <Button
        variant="contained"
        size="small"
        color="inherit"
        onClick={onCancel}
        disabled={cancelDisabled}
      >
        {cancelLabel ?? t("common.cancel")}
      </Button>
      <Button
        variant="contained"
        size="small"
        color={color}
        type={formId ? "submit" : "button"}
        form={formId}
        onClick={onConfirm}
        disabled={pending || disabled}
      >
        {pending ? pendingContent : confirmLabel}
      </Button>
    </>
  );
};
