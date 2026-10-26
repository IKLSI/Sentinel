import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { ToastSeverity } from "@/enums";

type Severity = ToastSeverity;

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastState {
  id: number;
  open: boolean;
  message: string;
  severity: Severity;
  action?: ToastAction;
}

interface ToastContextValue {
  showToast: (
    message: string,
    severity?: Severity,
    action?: ToastAction,
  ) => void;
  closeToast: () => void;
}

export const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  closeToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function useToastState(): {
  toast: ToastState;
  actions: ToastContextValue;
} {
  const [toast, setToast] = useState<ToastState>({
    id: 0,
    open: false,
    message: "",
    severity: ToastSeverity.Info,
  });

  const showToast = useCallback(
    (
      message: string,
      severity: Severity = ToastSeverity.Info,
      action?: ToastAction,
    ) => {
      setToast((previous) => ({
        id: previous.id + 1,
        open: true,
        message,
        severity,
        action,
      }));
    },
    [],
  );

  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  const actions = useMemo(
    () => ({ showToast, closeToast }),
    [showToast, closeToast],
  );

  return { toast, actions };
}
