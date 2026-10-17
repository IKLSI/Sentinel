import type React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useDeleteMyAccountMutation } from "@/domains/users/mutations";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { AppModal } from "@/components/ui/common/AppModal";
import { useT } from "@/contexts/I18nContext";
import { STORAGE_KEYS } from "@/constants/storage";
import { ROUTES } from "@/constants/routes";
import { inp } from "@/features/users/pages/ProfilePage/constants";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const DeleteAccountModal: React.FC<Props> = ({ open, onClose }) => {
  const t = useT();
  const onDeleteError = useApiErrorToast("profile.gdpr.delete_error");
  const [deletePassword, setDeletePassword] = useState("");

  const deleteAccount = useDeleteMyAccountMutation();
  const deletingAccount = deleteAccount.isPending;

  const closeAndReset = () => {
    onClose();
    setDeletePassword("");
  };

  const handleDeleteAccount = () => {
    if (!deletePassword.trim()) return;
    deleteAccount.mutate(
      { data: { password: deletePassword } },
      {
        onSuccess: () => {
          Object.values(STORAGE_KEYS).forEach((k) => {
            localStorage.removeItem(k);
          });
          window.location.href = ROUTES.LOGIN;
        },
        onError: onDeleteError,
      },
    );
  };

  return (
    <AppModal
      open={open}
      onClose={() => {
        if (!deletingAccount) closeAndReset();
      }}
      title={t("profile.gdpr.delete_confirm_title")}
      maxWidth="xs"
      actions={
        <>
          <Button
            variant="contained"
            size="small"
            className="btn-cancel"
            onClick={closeAndReset}
            disabled={deletingAccount}
          >
            {t("profile.gdpr.cancel")}
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={handleDeleteAccount}
            disabled={deletingAccount || !deletePassword.trim()}
          >
            {deletingAccount
              ? t("profile.gdpr.deleting")
              : t("profile.gdpr.delete_confirm")}
          </Button>
        </>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Box
          sx={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            lineHeight: 1.65,
          }}
        >
          {t("profile.gdpr.delete_confirm_body")}
        </Box>
        <Box>
          <Box
            sx={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--muted2)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              mb: "7px",
            }}
          >
            {t("profile.gdpr.delete_password_label")}
          </Box>
          <Box
            component="input"
            type="password"
            sx={{ ...inp, py: "9px", px: "12px", fontSize: "13px" }}
            value={deletePassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDeletePassword(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter" && deletePassword.trim())
                handleDeleteAccount();
            }}
            autoFocus
          />
        </Box>
      </Box>
    </AppModal>
  );
};
