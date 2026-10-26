import type React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import {
  MODAL_ACTIONS_SX,
  MODAL_TITLE_SX,
} from "@/components/ui/common/modalSx";

interface DeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  confirmingLabel?: string;
  irreversible?: boolean;
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
  irreversible = false,
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
            borderRadius: "10px",
            overflow: "hidden",
          },
        },
      }}
    >
      <DialogTitle sx={{ ...MODAL_TITLE_SX, p: "16px 20px" }}>
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
          {irreversible && (
            <>
              <br />
              {t("common.action_irreversible_before")}
              <b>{t("common.action_irreversible_word")}</b>
              {t("common.action_irreversible_after")}
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ ...MODAL_ACTIONS_SX, p: "12px 20px" }}>
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
