import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { type ToastActionKind, ToastSeverity } from "@/enums";

type Severity = ToastSeverity;

interface ToastAction {
  label: string;
  onClick: () => void;
  kind?: ToastActionKind;
  onExpire?: () => void;
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
  runAction: () => void;
} {
  const [toast, setToast] = useState<ToastState>({
    id: 0,
    open: false,
    message: "",
    severity: ToastSeverity.Info,
  });
  const pendingExpireRef = useRef<(() => void) | null>(null);

  const flushPendingExpire = useCallback(() => {
    const expire = pendingExpireRef.current;
    pendingExpireRef.current = null;
    expire?.();
  }, []);

  useEffect(() => {
    window.addEventListener("pagehide", flushPendingExpire);
    return () => window.removeEventListener("pagehide", flushPendingExpire);
  }, [flushPendingExpire]);

  const showToast = useCallback(
    (
      message: string,
      severity: Severity = ToastSeverity.Info,
      action?: ToastAction,
    ) => {
      flushPendingExpire();
      pendingExpireRef.current = action?.onExpire ?? null;
      setToast((previous) => ({
        id: previous.id + 1,
        open: true,
        message,
        severity,
        action,
      }));
    },
    [flushPendingExpire],
  );

  const closeToast = useCallback(() => {
    flushPendingExpire();
    setToast((prev) => ({ ...prev, open: false }));
  }, [flushPendingExpire]);

  const runAction = useCallback(() => {
    pendingExpireRef.current = null;
    setToast((prev) => ({ ...prev, open: false }));
    toast.action?.onClick();
  }, [toast.action]);

  const actions = useMemo(
    () => ({ showToast, closeToast }),
    [showToast, closeToast],
  );

  return { toast, actions, runAction };
}
