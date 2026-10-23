import type React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";

interface DeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  confirmingLabel?: string;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  open,
  onClose,
  onConfirm,
  loading = false,
  title,
  children,
  confirmLabel,
  confirmingLabel,
}) => {
  const t = useT();
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: "var(--s1)",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "10px",
            overflow: "hidden",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          fontSize: "14px",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          p: "16px 20px",
          borderBottom: "1px solid var(--border)",
          background:
            "linear-gradient(135deg, var(--accent-subtle) 0%, var(--s2) 60%)",
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent sx={{ pt: "18px !important", pb: "18px" }}>
        <Box
          sx={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            lineHeight: 1.65,
            "& strong": {
              fontWeight: 600,
              color: "var(--red)",
              background: "color-mix(in srgb, var(--red) 8%, transparent)",
              border:
                "1px solid color-mix(in srgb, var(--red) 20%, transparent)",
              borderRadius: "4px",
              padding: "1px 6px",
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
            },
            "& b": {
              fontWeight: 700,
              color: "var(--text)",
            },
          }}
        >
          {children}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: "12px 20px",
          borderTop: "1px solid var(--border)",
          background: "var(--s2)",
          gap: "8px",
        }}
      >
        <Button
          variant="contained"
          size="small"
          color="inherit"
          onClick={onClose}
          disabled={loading}
        >
          {t("common.cancel")}
        </Button>
        <Button
          variant="contained"
          color="error"
          size="small"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading
            ? (confirmingLabel ?? t("common.deleting"))
            : (confirmLabel ?? t("common.delete"))}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
