import { useCallback } from "react";
import { useT } from "@/contexts/I18nContext";
import { ToastActionKind, ToastSeverity } from "@/enums";
import { useToast } from "@/hooks/useToast";

interface UndoToastOptions {
  severity?: ToastSeverity;
  onExpire?: () => void;
}

export function useUndoToast() {
  const t = useT();
  const { showToast } = useToast();

  return useCallback(
    (
      message: string,
      undo: () => void,
      { severity = ToastSeverity.Success, onExpire }: UndoToastOptions = {},
    ) =>
      showToast(message, severity, {
        label: t("common.undo"),
        kind: ToastActionKind.Undo,
        onClick: undo,
        onExpire,
      }),
    [showToast, t],
  );
}
