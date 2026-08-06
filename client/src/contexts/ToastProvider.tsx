import type React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { ToastContext, useToastState } from "@/hooks/useToast";

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const toastState = useToastState();
  return (
    <ToastContext.Provider value={toastState}>
      {children}
      <Snackbar
        open={toastState.toast.open}
        autoHideDuration={4000}
        onClose={(_, reason) =>
          reason !== "clickaway" && toastState.closeToast()
        }
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={toastState.toast.severity}
          onClose={toastState.closeToast}
          variant="filled"
          sx={{ minWidth: "280px" }}
        >
          {toastState.toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};
