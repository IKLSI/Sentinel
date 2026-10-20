import type React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

interface AppModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg";
}

export const AppModal: React.FC<AppModalProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = "sm",
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth={maxWidth}
    fullWidth
    slotProps={{
      paper: {
        sx: {
          bgcolor: "var(--s1)",
          border: "1px solid",
          borderColor: "divider",
        },
      },
    }}
  >
    <DialogTitle
      sx={{
        fontSize: "14px",
        fontWeight: 700,
        letterSpacing: "-0.02em",
        p: "16px 24px",
        borderBottom: "1px solid var(--border)",
        background:
          "linear-gradient(135deg, var(--accent-subtle) 0%, var(--s2) 60%)",
      }}
    >
      {title}
    </DialogTitle>
    <DialogContent sx={{ pt: "20px !important" }}>{children}</DialogContent>
    {actions && (
      <DialogActions
        sx={{
          p: "14px 20px",
          borderTop: "1px solid var(--border)",
          background: "var(--s2)",
          gap: "8px",
        }}
      >
        {actions}
      </DialogActions>
    )}
  </Dialog>
);
