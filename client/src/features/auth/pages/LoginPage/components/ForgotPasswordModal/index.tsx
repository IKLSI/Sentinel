import type React from "react";
import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { AppModal } from "@/components/ui/common/modal/AppModal";
import { ModalActions } from "@/components/ui/common/modal/ModalActions";
import { FormTextField } from "@/components/ui/forms/FormTextField";
import { AuthModalSuccess } from "@/features/auth/components/AuthSuccessPanel";
import { useForgotPasswordMutation } from "@/domains/auth/mutations";
import { useT } from "@/contexts/I18nContext";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/features/auth/schemas";

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  open,
  onClose,
}) => {
  const t = useT();
  const onError = useApiErrorToast("auth.forgot_password.error_generic");
  const {
    register,
    handleSubmit: handleFormSubmit,
    reset,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  const forgotPasswordMutation = useForgotPasswordMutation();
  const loading = forgotPasswordMutation.isPending;
  const emailId = useId();
  const formId = useId();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      reset({ email: "" });
      setDone(false);
    }
  }, [open, reset]);

  const onSubmit = handleFormSubmit((data) => {
    forgotPasswordMutation.mutate(
      { data: { email: data.email } },
      { onSuccess: () => setDone(true), onError },
    );
  });

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t("auth.forgot_password.form_title")}
      maxWidth="xs"
      actions={
        done ? (
          <Button variant="contained" size="small" onClick={onClose}>
            {t("common.close")}
          </Button>
        ) : (
          <ModalActions
            onCancel={onClose}
            cancelDisabled={loading}
            confirmLabel={t("auth.forgot_password.submit")}
            pending={loading}
            formId={formId}
          />
        )
      }
    >
      {done ? (
        <AuthModalSuccess
          title={t("auth.forgot_password.success_title")}
          subtitle={t("auth.forgot_password.success_sub")}
        />
      ) : (
        <Box
          component="form"
          id={formId}
          onSubmit={onSubmit}
          noValidate
          sx={{ display: "flex", flexDirection: "column", gap: "14px" }}
        >
          <FormTextField
            id={emailId}
            label={t("auth.forgot_password.email_label")}
            registration={register("email")}
            autoFocus
            error={errors.email}
            t={t}
            type="email"
            placeholder={t("auth.forgot_password.email_placeholder")}
            autoComplete="email"
            required
          />
        </Box>
      )}
    </AppModal>
  );
};
