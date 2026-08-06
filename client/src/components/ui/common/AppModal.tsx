import type React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Box from "@mui/material/Box";

interface AppModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg";
  maxWidthPx?: string;
  closeButton?: boolean;
  backdropVariant?: "default" | "auth";
  closeButtonLabel?: string;
}

export const AppModal: React.FC<AppModalProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = "sm",
  maxWidthPx,
  closeButton = false,
  backdropVariant = "default",
  closeButtonLabel = "Fermer",
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
          ...(maxWidthPx
            ? {
                borderRadius: "var(--r-xl)",
                overflow: "hidden",
                m: "24px",
                width: "calc(100% - 48px)",
                maxWidth: maxWidthPx,
              }
            : {}),
        },
      },
      ...(backdropVariant === "auth"
        ? {
            backdrop: {
              sx: {
                backdropFilter: "blur(6px)",
                background:
                  "color-mix(in srgb, var(--auth-bg) 75%, transparent)",
              },
            },
          }
        : {}),
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
        ...(closeButton
          ? {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }
          : {}),
      }}
    >
      {title}
      {closeButton && (
        <Box
          component="button"
          onClick={onClose}
          sx={{
            width: 24,
            height: 24,
            borderRadius: "var(--r-sm)",
            border: "1px solid var(--border)",
            background: "var(--s1)",
            color: "var(--muted)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            "&:hover": { background: "var(--s2)", color: "var(--text)" },
          }}
          aria-label={closeButtonLabel}
        >
          ×
        </Box>
      )}
    </DialogTitle>
    <DialogContent
      sx={{ pt: "20px !important", ...(maxWidthPx ? { pb: "24px" } : {}) }}
    >
      {children}
    </DialogContent>
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
