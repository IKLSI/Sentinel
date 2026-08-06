import { createContext, useContext, useState, useCallback } from "react";
import { ToastSeverity } from "@/enums";

type Severity = ToastSeverity;

interface ToastState {
  open: boolean;
  message: string;
  severity: Severity;
}

interface ToastContextValue {
  toast: ToastState;
  showToast: (message: string, severity?: Severity) => void;
  closeToast: () => void;
}

export const ToastContext = createContext<ToastContextValue>({
  toast: { open: false, message: "", severity: ToastSeverity.Info },
  showToast: () => {},
  closeToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function useToastState(): ToastContextValue {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    severity: ToastSeverity.Info,
  });

  const showToast = useCallback(
    (message: string, severity: Severity = ToastSeverity.Info) => {
      setToast({ open: true, message, severity });
    },
    [],
  );

  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  return { toast, showToast, closeToast };
}
