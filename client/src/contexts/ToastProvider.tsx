import type React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { ToastContext, useToastState } from "@/hooks/useToast";

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { toast, actions } = useToastState();
  return (
    <ToastContext.Provider value={actions}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={(_, reason) => reason !== "clickaway" && actions.closeToast()}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={toast.severity}
          onClose={actions.closeToast}
          variant="filled"
          sx={{ minWidth: "280px" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};
