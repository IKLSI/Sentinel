import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { ToastSeverity } from "@/enums";

type Severity = ToastSeverity;

interface ToastState {
  open: boolean;
  message: string;
  severity: Severity;
}

interface ToastContextValue {
  showToast: (message: string, severity?: Severity) => void;
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

  const actions = useMemo(
    () => ({ showToast, closeToast }),
    [showToast, closeToast],
  );

  return { toast, actions };
}
