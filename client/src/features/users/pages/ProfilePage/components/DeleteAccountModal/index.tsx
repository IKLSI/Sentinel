import type React from "react";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import { useDeleteMyAccountMutation } from "@/domains/users/mutations";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { AppModal } from "@/components/ui/common/AppModal";
import { ModalActions } from "@/components/ui/common/ModalActions";
import { useT } from "@/contexts/I18nContext";
import { endSession } from "@/configs/session";
import { ROUTES } from "@/constants/routes";
import { FormTextField } from "@/components/ui/forms/FormTextField";
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
        <ModalActions
          onCancel={closeAndReset}
          cancelLabel={t("profile.gdpr.cancel")}
          cancelDisabled={deletingAccount}
          confirmLabel={t("profile.gdpr.delete_confirm")}
          pendingLabel={t("profile.gdpr.deleting")}
          pending={deletingAccount}
          disabled={!hasPassword}
          formId={formId}
          color="error"
        />
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
        <FormTextField
          id={`${formId}-password`}
          label={t("profile.gdpr.delete_password_label")}
          registration={register("password")}
          type="password"
          autoFocus
        />
      </Box>
    </AppModal>
  );
};
