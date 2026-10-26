import type React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import {
  MODAL_ACTIONS_SX,
  MODAL_TITLE_SX,
} from "@/components/ui/common/modalSx";

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
  <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth>
    <DialogTitle sx={{ ...MODAL_TITLE_SX, p: "16px 24px" }}>
      {title}
    </DialogTitle>
    <DialogContent sx={{ pt: "20px !important" }}>{children}</DialogContent>
    {actions && (
      <DialogActions sx={{ ...MODAL_ACTIONS_SX, p: "14px 20px" }}>
        {actions}
      </DialogActions>
    )}
  </Dialog>
);
