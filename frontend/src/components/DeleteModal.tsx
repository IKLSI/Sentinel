import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { useT } from "../i18n/I18nContext";

interface DeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title: string;
  children: React.ReactNode;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  open,
  onClose,
  onConfirm,
  loading = false,
  title,
  children,
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
            "linear-gradient(135deg, var(--red-subtle) 0%, var(--s2) 60%)",
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent sx={{ pt: "20px !important" }}>
        <Box sx={{ fontSize: "14px", color: "var(--text)", lineHeight: 1.6 }}>
          {children}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: "14px 20px",
          borderTop: "1px solid var(--border)",
          background: "var(--s2)",
          gap: "8px",
        }}
      >
        <Button
          variant="outlined"
          size="small"
          className="btn-cancel"
          sx={{ textTransform: "none" }}
          onClick={onClose}
          disabled={loading}
        >
          {t("common.cancel")}
        </Button>
        <Button
          variant="contained"
          size="small"
          sx={{
            textTransform: "none",
            background: "var(--red)",
            "&:hover": { background: "color-mix(in srgb, var(--red) 88%, black)" },
            "&:disabled": { background: "var(--red)", opacity: 0.6 },
          }}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? t("common.deleting") : t("common.delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
