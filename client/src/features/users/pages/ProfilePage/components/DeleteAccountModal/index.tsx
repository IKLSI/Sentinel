import type React from "react";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useDeleteMyAccountMutation } from "@/domains/users/mutations";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { AppModal } from "@/components/ui/common/AppModal";
import { useT } from "@/contexts/I18nContext";
import { endSession } from "@/configs/session";
import { ROUTES } from "@/constants/routes";
import { inp } from "@/features/users/pages/ProfilePage/constants";
import {
  type DeleteAccountFormValues,
  deleteAccountSchema,
} from "@/features/users/pages/ProfilePage/components/DeleteAccountModal/schemas";

const EMPTY_FORM: DeleteAccountFormValues = { password: "" };

interface Props {
  open: boolean;
  onClose: () => void;
}

export const DeleteAccountModal: React.FC<Props> = ({ open, onClose }) => {
  const t = useT();
  const onDeleteError = useApiErrorToast("profile.gdpr.delete_error");
  const formId = useId();
  const { register, handleSubmit, reset, watch } =
    useForm<DeleteAccountFormValues>({
      resolver: zodResolver(deleteAccountSchema),
      defaultValues: EMPTY_FORM,
    });
  const hasPassword = watch("password").trim().length > 0;

  const deleteAccount = useDeleteMyAccountMutation();
  const deletingAccount = deleteAccount.isPending;

  const closeAndReset = () => {
    onClose();
    reset(EMPTY_FORM);
  };

  const handleDeleteAccount = handleSubmit(({ password }) => {
    deleteAccount.mutate(
      { data: { password } },
      {
        onSuccess: () => {
          endSession();
          window.location.href = ROUTES.LOGIN;
        },
        onError: onDeleteError,
      },
    );
  });

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
            type="submit"
            form={formId}
            disabled={deletingAccount || !hasPassword}
          >
            {deletingAccount
              ? t("profile.gdpr.deleting")
              : t("profile.gdpr.delete_confirm")}
          </Button>
        </>
      }
    >
      <Box
        component="form"
        id={formId}
        onSubmit={handleDeleteAccount}
        noValidate
        sx={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
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
            {...register("password")}
            autoFocus
          />
        </Box>
      </Box>
    </AppModal>
  );
};
